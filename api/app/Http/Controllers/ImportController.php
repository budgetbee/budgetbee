<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use App\Models\Record;
use Exception;
use App\Models\Import;
use PhpOffice\PhpSpreadsheet\IOFactory;

class ImportController extends Controller
{
    public function import(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|file'
        ]);

        $file = $request->file('file');

        $fileExtension = $file->getClientOriginalExtension();
        $validExtensions = ['json', 'xls', 'xlsx'];

        if ($file->isValid() && in_array($fileExtension, $validExtensions)) {

            if ($fileExtension === 'json') {
                $records = $this->extractFromJson($file);
            } else {
                $records = $this->extractFromExcel($file);
            }

            if ($records) {
                $importModel = Import::create(
                    [
                        'file_name' => $file->getClientOriginalName(),
                        'file_extension' => $file->getClientOriginalExtension(),
                        'file_size' => $file->getSize(),
                        'user_id' => auth()->user()->id,
                    ]
                );

                foreach ($records as $record) {
                    try {
                        $record->import_id = $importModel->id;
                        $record->save();
                    } catch (Exception $e) {
                        foreach ($records as $record) {
                            $record->forceDelete();
                        }
                        $importModel->forceDelete();
                        return response()->json(['error' => 'Error to save records, check file and try again'], 500);
                    }
                }
                return response()->json(['message' => 'File uploaded successfully']);
            }
        }
        return response()->json(['error' => 'Error, there is no records to upload'], 400);
    }

    private function extractFromJson($file): ?array
    {
        $user = auth()->user();
        $jsonContent = File::get($file->getPathname());
        $jsonData = json_decode($jsonContent, true);

        $records = [];

        foreach ($jsonData as $row) {

            try {
                if (
                    !array_key_exists('date', $row) ||
                    !array_key_exists('from_account_id', $row) ||
                    !array_key_exists('to_account_id', $row) ||
                    !array_key_exists('category_id', $row) ||
                    !array_key_exists('name', $row) ||
                    !array_key_exists('type', $row) ||
                    !array_key_exists('amount', $row) ||
                    !array_key_exists('rate', $row)
                ) {
                    throw new \InvalidArgumentException('Invalid params');
                }

                $row['rate'] = $row['rate'] ?? 1;

                $record = new Record([
                    'user_id' => $user->id,
                    'date' => $row['date'],
                    'from_account_id' => $row['from_account_id'],
                    'to_account_id' => $row['to_account_id'],
                    'category_id' => $row['category_id'],
                    'name' => $row['name'],
                    'type' => $row['type'],
                    'amount' => $row['amount'],
                    'rate' => $row['rate']
                ]);

                $code = $user->id . $record->date . $record->from_account_id . $record->to_account_id . $record->category_id . $record->name . $record->type . $record->amount . $record->rate;
                $record->code = hash('sha256', $code);

                $records[] = $record;
            } catch (Exception $e) {
                return null;
            }
        }

        return $records;
    }

    private function extractFromExcel($file): ?array
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
        } catch (Exception $e) {
            return null;
        }

        $worksheet = $spreadsheet->getActiveSheet();
        $highestRow = $worksheet->getHighestRow();

        $user = auth()->user();
        $records = [];

        for ($row = 2; $row <= $highestRow; $row++) {
            try {

                if (!empty($worksheet->getCell([1, $row])->getValue())) {
                    $record = new Record([
                        'user_id' => $user->id,
                        'date' => $worksheet->getCell([1, $row])->getValue(),
                        'from_account_id' => $worksheet->getCell([2, $row])->getValue(),
                        'to_account_id' => $worksheet->getCell([3, $row])->getValue(),
                        'type' => $worksheet->getCell([4, $row])->getValue(),
                        'category_id' => $worksheet->getCell([5, $row])->getValue(),
                        'name' => $worksheet->getCell([6, $row])->getValue(),
                        'amount' => $worksheet->getCell([7, $row])->getValue(),
                        'rate' => $worksheet->getCell([8, $row])->getValue()
                    ]);
    
                    $code = $user->id . $record->date . $record->from_account_id . $record->to_account_id . $record->category_id . $record->name . $record->type . $record->amount . $record->rate;
                    $record->code = hash('sha256', $code);
    
                    $records[] = $record;
                }
                 
            } catch (Exception $e) {
                return null;
            }
        }

        return $records;
    }
}
