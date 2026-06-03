<?php

namespace App\Http\Controllers;

use App\Models\Record;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\Process\Process;

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
     * Handle chat messages from the chatbot.
     * Currently returns a dummy response for UI testing.
     */
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:2000',
        ]);

        $userMessage = $request->input('message');

        // TODO: Integrate with OpenAI / DeepSeek API using stored provider keys
        $dummyResponses = [
            "Hello! I'm BudgetBee's AI assistant. I can help you with your finances, budgets, and expenses. What would you like to know?",
            "That's a great question! In the future, I'll be able to analyze your spending patterns and give personalized advice.",
            "I'm still learning, but soon I'll help you track expenses, categorize records, and manage your budget more efficiently.",
            "Thanks for your message! I'm here to help with anything related to your BudgetBee account.",
            "Interesting! Once I'm fully integrated with your data, I'll provide insights about your financial habits.",
        ];

        $response = $dummyResponses[array_rand($dummyResponses)];

        return response()->json([
            'message' => $response,
        ]);
    }
}
