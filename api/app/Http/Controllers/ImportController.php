<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use App\Models\Record;
use Exception;
use App\Models\Import;

class ImportController extends Controller
{

    public function importJson(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|file'
        ]);

        $file = $request->file('file');

        if ($file->isValid() && $file->getClientOriginalExtension() === 'json') {

            $jsonContent = File::get($file->getPathname());

            $jsonData = json_decode($jsonContent, true);

            $resume = [
                'successful' => 0,
                'failed' => 0,
                'already_exists' => 0,
                'successful_records' => [],
                'failed_records' => [],
                'already_exists_records' => []
            ];
            
            $user = $request->user();

            $importModel = Import::create(
                [
                    'file_name' => $file->getClientOriginalName(),
                    'file_extension' => $file->getClientOriginalExtension(),
                    'file_size' => $file->getSize(),
                    'user_id' => $user->id
                ]
            );

            foreach ($jsonData as $row) {

                $row['to_account_id'] = $row['to_account_id'] ?? null;
                $row['type'] = $row['amount'] >= 0 ? 'income' : 'expense';
                $row['rate'] = $row['rate'] ?? 1;

                $code = base64_encode($user->id . $row['date'] . $row['from_account_id'] . $row['to_account_id'] . $row['category_id'] . $row['name'] . $row['type'] . $row['amount'] . $row['rate']);

                $record = new Record([
                    'user_id' => $user->id,
                    'date' => $row['date'],
                    'from_account_id' => $row['from_account_id'],
                    'to_account_id' => $row['to_account_id'],
                    'category_id' => $row['category_id'],
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'amount' => $row['amount'],
                    'rate' => $row['rate'],
                    'code' => $code,
                    'import_id' => $importModel->id
                ]);

                $recordSummary = ['date' => $row['date'], 'amount' => $row['amount'], 'name' => $row['name'], 'account_id' => $row['from_account_id'], 'to_account' => $row['to_account_id'], 'category' => $row['category_id']];
                
                $existingRecord = Record::where('code', $code)->first();

                if (!$existingRecord) {
                    try {
                        $record->save();
                        $resume['successful']++;
                        $resume['successful_records'][] = $recordSummary;
                    } catch (Exception $e) {
                        $recordSummary['error'] = 'Error to save record, check if accounts and category exists';
                        $resume['failed']++;
                        $resume['failed_records'][] = $recordSummary;
                    }
                }
                else {
                    $resume['already_exists']++;
                    $resume['already_exists_records'][] = $recordSummary;
                }
            }

            $response = ['message' => 'JSON file imported successfully'];

            return response()->json(array_merge($response, $resume));
        }

        return response()->json(['error' => 'Invalid JSON file'], 400);
    }
}
