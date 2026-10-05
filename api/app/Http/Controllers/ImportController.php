<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Import;
use App\Models\Record;
use App\Services\Categorization\CategoryClassifier;
use App\Services\Categorization\CategoryLearner;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;

class ImportController extends Controller
{
    public function import(Request $request)
    {
        $this->validate($request, [
            'file' => 'required|file|max:10240',
            'auto_categorise' => 'nullable|boolean',
        ]);

        // Only rows WITHOUT a category are touched: whatever the user's own
        // system brought in is respected exactly as it came.
        $autoCategorise = $request->boolean('auto_categorise');

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

                $imported = 0;
                $skipped = 0;
                $autoCategorised = 0;
                $unknown = 0;
                // One query, not one per row.
                $fallbackId = $this->fallbackCategoryId((int) auth()->user()->id);

                foreach ($records as $record) {
                    try {
                        // code is unique (records_code_unique) to prevent
                        // duplicate imports — skip rows that already exist
                        // instead of failing the whole file.
                        if (Record::where('user_id', $record->user_id)->where('code', $record->code)->exists()) {
                            $skipped++;
                            continue;
                        }
                        $record->import_id = $importModel->id;

                        if (! $record->category_id) {
                            $prediction = (array) app(CategoryClassifier::class)
                                ->classify((int) $record->user_id, $record->name ?: $record->description);
                            $predictedId = $prediction['category_id'] ?? null;

                            $record->category_id = $predictedId ?: $fallbackId;

                            if ($predictedId) {
                                $autoCategorised++;
                            } else {
                                $unknown++;
                            }
                        } elseif ($fallbackId && (int) $record->category_id === (int) $fallbackId) {
                            $unknown++;
                        }

                        // Deterministic categorisation: derive the merchant key.
                        // Imported rows carry the user's own categories, so this
                        // is also the evidence that grows learned rules.
                        $record->merchant_key = app(CategoryClassifier::class)
                            ->merchantKey($record->name ?: $record->description);
                        $record->save();
                        $imported++;

                        if ($record->merchant_key) {
                            app(CategoryLearner::class)->confirm(
                                (int) $record->user_id,
                                $record->merchant_key,
                                (int) $record->category_id
                            );
                        }
                    } catch (Exception $e) {
                        // One bad row must not discard the whole file.
                        Log::warning('Import row skipped: ' . $e->getMessage());
                        $skipped++;
                    }
                }

                if ($imported === 0) {
                    $importModel->forceDelete();
                    return response()->json(['error' => 'Error to save records, check file and try again'], 500);
                }

                $message = 'File uploaded successfully';
                if ($skipped > 0) {
                    $message .= " ($imported imported, $skipped duplicate or invalid row(s) skipped)";
                }

                return response()->json([
                    'message' => $message,
                    'imported' => $imported,
                    'skipped' => $skipped,
                    'auto_categorised' => $autoCategorised,
                    'unknown' => $unknown,
                ]);
            }
        }
        return response()->json(['error' => 'Error, there is no records to upload'], 400);
    }

    private function extractFromJson($file): ?array
    {
        $user = auth()->user();
        $jsonContent = File::get($file->getPathname());

        // Bank exports come in Windows-1252: their raw bytes are not valid UTF-8,
        // so json_decode fails and any accented merchant name ends up mangled in
        // the database. Convert only when the content is not already UTF-8.
        if (! mb_check_encoding($jsonContent, 'UTF-8')) {
            $jsonContent = mb_convert_encoding($jsonContent, 'UTF-8', 'Windows-1252');
        }

        $jsonData = json_decode($jsonContent, true);

        $records = [];

        foreach ($jsonData as $row) {
            try {
                if (
                    !array_key_exists('date', $row) ||
                    !array_key_exists('from_account_id', $row) ||
                    !array_key_exists('to_account_id', $row) ||
                    !array_key_exists('name', $row) ||
                    !array_key_exists('type', $row) ||
                    !array_key_exists('amount', $row) ||
                    !array_key_exists('rate', $row)
                ) {
                    throw new \InvalidArgumentException('Invalid params');
                }

                // No category in the file? Leave it null and decide at import time
                // (the user's own rules when auto-categorising, otherwise "unknown").
                // This used to hardcode category 44, which meant nothing.
                if (!array_key_exists('category_id', $row) || empty($row['category_id'])) {
                    $row['category_id'] = null;
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
                // One bad row must not discard the whole file: skip it and keep going.
                Log::warning('Import row skipped: ' . $e->getMessage());
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
                $dateCell = $worksheet->getCell([1, $row]);
                $dateValue = $dateCell->getValue();

                if (empty($dateValue)) {
                    continue;
                }

                if (SpreadsheetDate::isDateTime($dateCell)) {
                    $dateTime = SpreadsheetDate::excelToDateTimeObject($dateValue);
                    $date = $dateTime->format('Y-m-d H:i:s');
                } else {
                    $date = $dateValue;
                }

                $categoryId = $worksheet->getCell([5, $row])->getValue();
                $name = $worksheet->getCell([6, $row])->getValue();

                // Never invent a category id: null means "decide at import time".
                $categoryId = empty($categoryId) ? null : $categoryId;

                $rate = $worksheet->getCell([8, $row])->getValue();
                $rate = $rate ?? 1;

                $record = new Record([
                    'user_id' => $user->id,
                    'date' => $date,
                    'from_account_id' => $worksheet->getCell([2, $row])->getValue(),
                    'to_account_id' => $worksheet->getCell([3, $row])->getValue(),
                    'type' => $worksheet->getCell([4, $row])->getValue(),
                    'category_id' => $categoryId,
                    'name' => $name,
                    'amount' => $worksheet->getCell([7, $row])->getValue(),
                    'rate' => $rate
                ]);

                $code = $user->id . $record->date . $record->from_account_id . $record->to_account_id . $record->category_id . $record->name . $record->type . $record->amount . $record->rate;
                $record->code = hash('sha256', $code);

                $records[] = $record;
            } catch (Exception $e) {
                Log::warning('Import row skipped: ' . $e->getMessage());
            }
        }

        return $records;
    }

    /**
     * Where an uncategorised movement lands when nothing else matches.
     */
    private function fallbackCategoryId(int $userId): ?int
    {
        $names = ['Desconocido', 'Unknown', 'Uncategorised', 'Uncategorized'];

        return \App\Models\Category::where('user_id', $userId)->whereIn('name', $names)->value('id')
            ?? \App\Models\Category::whereIn('name', $names)->value('id')
            ?? \App\Models\Category::where('user_id', $userId)->min('id');
    }
}
