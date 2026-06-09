<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use App\Services\Ai\AiChatService;
use PhpOffice\PhpSpreadsheet\IOFactory;
use Illuminate\Support\Facades\Log;

class AiController extends Controller
{
    public static function trainModel()
    {
        $records = DB::table('records')
            ->select('name', 'category_id', 'type', 'amount')
            ->whereNot('category_id', 44)
            ->whereNotNull('name')
            ->whereNotNull('category_id')
            ->get();

        $data = json_encode($records->toArray());

        $process = new Process(['python3', '/var/www/html/app/Ai/train_and_predict.py', 'train', $data]);
        $process->run();

        if (!$process->isSuccessful()) {
            $error = $process->getErrorOutput();
            logger()->error('Training Process Failed: ' . $error);
        }
    }

    public static function trainModelWithRecord(Record $record)
    {

        if (!file_exists(storage_path('app/ai/models/category_predictor.pkl'))) {
            self::trainModel();
        }

        $data = json_encode([[
            'name' => $record->name,
            'category_id' => $record->category_id
        ]]);

        $process = new Process(['python3', '/var/www/html/app/Ai/train_and_predict.py', 'train', $data]);
        $process->run();

        if (!$process->isSuccessful()) {
            $error = $process->getErrorOutput();
            logger()->error('Training Process Failed: ' . $error);
        }
    }

    public static function predictCategory(string $name)
    {
        $data = json_encode([[
            'name' => $name
        ]]);

        $process = new Process(['python3', '/var/www/html/app/Ai/train_and_predict.py', 'predict', $data]);
        $process->run();

        if (!$process->isSuccessful()) {
            $error = $process->getErrorOutput();
            logger()->error('Predict Process Failed: ' . $error);
        }

        $category_id = trim($process->getOutput());

        $category = Category::find($category_id);

        if (!$category) {
            $category = Category::find(44);
        }

        return $category;
    }

    public function predictCategoryRequest(Request $request)
    {
        $name = $request->get('name');

        $category = $this->predictCategory($name);

        return response()->json([
            'category' => $category->id,
            'parent_category' => $category->parent_category_id
        ]);
    }

    /**
     * Clear the conversation history for the authenticated user.
     */
    public function clearHistory(Request $request)
    {
        $chatService = new AiChatService($request->user());
        $chatService->clearHistory();

        return response()->json(['message' => 'Conversation history cleared.']);
    }

    /**
     * Handle chat messages from the chatbot with MCP tool-calling.
     * Uses the user's configured AI provider (OpenAI or DeepSeek).
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'nullable|string|max:2000',
            'files' => 'nullable|array',
            'files.*' => 'file|max:10240',
        ]);

        $userMessage = (string) $request->input('message', '');
        $uploadedFiles = $request->file('files', []);

        $fileInfo = [];
        $spreadsheetText = '';

        if ($uploadedFiles) {
            foreach ($uploadedFiles as $file) {
                $mime = $file->getMimeType();
                $ext = strtolower($file->getClientOriginalExtension());

                // Parse spreadsheets and extract tabular data as text
                if (in_array($ext, ['xlsx', 'xls', 'csv', 'ods']) || in_array($mime, [
                    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'application/vnd.ms-excel',
                    'text/csv',
                    'application/vnd.oasis.opendocument.spreadsheet',
                ])) {
                    try {
                        $spreadsheetText .= $this->parseSpreadsheet($file->getRealPath(), $file->getClientOriginalName());
                    } catch (\Exception $e) {
                        Log::error('Failed to parse spreadsheet', [
                            'file' => $file->getClientOriginalName(),
                            'error' => $e->getMessage(),
                        ]);
                        $spreadsheetText .= "\n\n[Could not read file: {$file->getClientOriginalName()}]\n";
                    }
                    continue;
                }

                // Validate file path is within the temp directory (prevents path traversal)
                $realPath = $file->getRealPath();
                $tempDir = sys_get_temp_dir();
                if (!str_starts_with(realpath($realPath), realpath($tempDir))) {
                    Log::warning('AI chat: suspicious file path detected', [
                        'user_id' => $request->user()->id,
                        'filename' => $file->getClientOriginalName(),
                    ]);
                    continue;
                }

                // Images go to vision processing
                $fileInfo[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $mime,
                    'path' => $realPath,
                ];
            }
        }

        // Append spreadsheet data to the user message
        if ($spreadsheetText) {
            $userMessage = trim($userMessage . "\n\n" . $spreadsheetText);
        }

        // Use MCP-enabled AI service if configured
        $chatService = new AiChatService($request->user());

        if ($chatService->isConfigured()) {
            $response = $chatService->chat($userMessage, $fileInfo);

            return response()->json([
                'message' => $response,
                'provider' => $chatService->getProviderName(),
            ]);
        }

        // Fallback: dummy response when no AI provider is configured
        $dummyResponses = [
            "Hello! I'm BudgetBee's AI assistant. I can help you with your finances, budgets, and expenses once you configure an AI provider. Go to Settings → Main Settings to add your OpenAI or DeepSeek API key.",
            "I'd love to help analyze your finances! Please configure an AI provider (OpenAI or DeepSeek) in Settings → Main Settings first.",
            "To unlock my full capabilities, add your OpenAI or DeepSeek API key in the Settings page. Then I'll be able to query your financial data and give you personalized insights!",
        ];

        $response = $dummyResponses[array_rand($dummyResponses)];

        if (!empty($fileInfo)) {
            $fileNames = implode(', ', array_column($fileInfo, 'name'));
            $response = "I received your message" . ($userMessage ? ": \"$userMessage\"" : "") . " along with " . count($fileInfo) . " file(s): $fileNames. Configure an AI provider in Settings to let me process them!";
        }

        return response()->json([
            'message' => $response,
        ]);
    }

    /**
     * Parse a spreadsheet file and extract data as a markdown table string.
     */
    private function parseSpreadsheet(string $path, string $filename): string
    {
        $spreadsheet = IOFactory::load($path);
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();

        if (empty($rows)) {
            return "\n\n**{$filename}**: (empty file)\n";
        }

        // Limit to 100 rows to avoid token explosion
        $rows = array_slice($rows, 0, 100);

        $output = "\n\n**File: {$filename}**\n\n";

        // Build markdown table
        $header = array_shift($rows);
        $header = array_map(fn($h) => trim((string)($h ?? '')), $header);

        $output .= '| ' . implode(' | ', $header) . " |\n";
        $output .= '| ' . implode(' | ', array_fill(0, count($header), '---')) . " |\n";

        foreach ($rows as $row) {
            $cells = array_map(fn($c) => trim((string)($c ?? '')), $row);
            // Pad to header length
            $cells = array_pad($cells, count($header), '');
            $output .= '| ' . implode(' | ', $cells) . " |\n";
        }

        $output .= "\n(File has " . count($rows) . " data rows)\n";

        return $output;
    }
}
