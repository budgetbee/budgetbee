<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;
use App\Services\Ai\AiChatService;

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
        if ($uploadedFiles) {
            foreach ($uploadedFiles as $file) {
                $fileInfo[] = [
                    'name' => $file->getClientOriginalName(),
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                    'path' => $file->getRealPath(),
                ];
            }
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
}
