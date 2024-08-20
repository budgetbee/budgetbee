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

        $rule = (new RuleController)->checkRules($name);
        if ($rule) {
            return $rule->getCategory();
        }

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
}
