<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Account;
use App\Models\Category;
use App\Models\Import;
use App\Models\ImportColumnMapping;
use App\Models\Record;
use App\Services\Categorization\CategoryClassifier;
use App\Services\Categorization\CategoryCorpus;
use App\Services\Categorization\CategoryLearner;
use App\Services\Import\ImportFileInspector;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;

class ImportController extends Controller
{
    /** Formats the app can read. CSV is new: banks hand it out everywhere. */
    private const VALID_EXTENSIONS = ['json', 'csv', 'xls', 'xlsx'];

    /** The biggest file the importer takes. The same number is said to the user. */
    private const MAX_FILE_BYTES = 10 * 1024 * 1024;

    // Every message the user can read. Plain, in English, saying what to do next.
    private const MESSAGE_NO_FILE = 'No file arrived. Choose it again and upload it.';
    private const MESSAGE_TOO_BIG = 'That file is bigger than the 10 MB the importer takes. Split the export into smaller files (for example, one per month) and try again.';
    private const MESSAGE_BAD_TYPE = 'That file type cannot be read. Upload a CSV, an Excel file (XLS, XLSX) or a JSON one.';
    private const MESSAGE_NO_COLUMNS = 'There are no rows we can read in this file. Check that it is not empty and that the line with the column names is there.';
    private const MESSAGE_NOTHING_READABLE = 'No movement could be read from this file. Check which column holds the date, the description and the amount.';
    private const MESSAGE_SAVE_FAILED = 'No movement could be saved from this file, so nothing was imported. Check the columns you chose and try again.';

    /**
     * Reads an uploaded file and says what is inside it, so the app can ask the
     * user to map the columns when the file is not the standard shape.
     */
    public function inspect(Request $request, ImportFileInspector $inspector)
    {
        $error = $this->checkFile($request);

        if ($error) {
            return $error;
        }

        $file = $request->file('file');

        // Rows the user wants left out of the file ("1-5, 12" or a JSON list), so
        // the preview shows what is really going to be imported.
        $skipRows = $inspector->parseSkipRows($request->input('skip_rows'));
        $data = $inspector->inspect($file, $skipRows);

        if (empty($data['columns'])) {
            return response()->json(['error' => self::MESSAGE_NO_COLUMNS], 400);
        }

        $saved = $this->savedMapping($columns = $data['columns'], $inspector);

        return response()->json([
            'format' => $data['format'],
            'columns' => $columns,
            'preview' => $data['preview'],
            'preview_row_numbers' => $data['preview_row_numbers'],
            'row_count' => $data['row_count'],
            'standard' => $data['standard'],
            'suggested' => $data['suggested'],
            'header_row' => $data['header_row'] ?? null,
            'skip_rows' => $data['skip_rows'],
            'skipped_count' => $data['skipped_count'],
            'saved_mapping' => $saved?->mapping,
            'saved_skip_rows' => $saved?->skip_rows,
            'saved_account_id' => $saved?->account_id,
            'fields' => ImportFileInspector::FIELDS,
            'required' => ImportFileInspector::REQUIRED,
        ]);
    }

    public function import(Request $request, ImportFileInspector $inspector)
    {
        $error = $this->checkFile($request);

        if ($error) {
            return $error;
        }

        // Only rows WITHOUT a category are touched: whatever the user's own
        // system brought in is respected exactly as it came.
        $autoCategorise = $request->boolean('auto_categorise');

        $file = $request->file('file');
        $fileExtension = strtolower($file->getClientOriginalExtension());

        $mapping = $this->decodeMapping($request->input('mapping'));
        $accountId = $this->resolveAccountId($request->input('account_id'));
        // Rows the user left out on screen (the holder, the balance, a total at
        // the end): numbered as they are in the file.
        $skipRows = $inspector->parseSkipRows($request->input('skip_rows'));
        $columns = [];

        if ($mapping) {
            // A file the user mapped on screen: read it again with the mapping
            // they confirmed and remember it for the next file of the same shape.
            $data = $inspector->inspect($file, $skipRows);
            $columns = $data['columns'];

            if (empty($columns)) {
                return response()->json(['error' => self::MESSAGE_NO_COLUMNS], 400);
            }

            $records = $this->extractWithMapping($columns, $data['rows'], $mapping, $accountId);
        } elseif ($fileExtension === 'json') {
            $records = $this->extractFromJson($file);
        } elseif (in_array($fileExtension, ['xls', 'xlsx'], true)) {
            $records = $this->extractFromExcel($file);
        } else {
            // CSV: either it follows the standard format (columns known by
            // position, exactly like the downloadable templates) or the user has
            // to say what each column holds. Never guess: a wrong guess imports
            // the wrong numbers.
            $data = $inspector->inspect($file);
            $columns = $data['columns'];

            if (empty($columns)) {
                // Nothing readable at all: this is not a mapping problem, so the
                // screen must not send the user to choose columns that are not there.
                return response()->json(['error' => self::MESSAGE_NO_COLUMNS], 400);
            }

            if (! $inspector->isStandard($columns)) {
                return response()->json([
                    'error' => 'Before importing this file we need to know which column holds the date, the description and the amount.',
                    'needs_mapping' => true,
                ], 409);
            }

            $mapping = $this->identityMapping($columns);
            $records = $this->extractWithMapping($columns, $data['rows'], $mapping, $accountId);
        }

        if (! $records) {
            return response()->json(['error' => self::MESSAGE_NOTHING_READABLE], 400);
        }

        $importModel = Import::create([
            'file_name' => $file->getClientOriginalName(),
            'file_extension' => $fileExtension,
            'file_size' => $file->getSize(),
            'user_id' => auth()->user()->id,
        ]);

        [$imported, $skipped, $duplicates, $autoCategorised, $unknown] = $this->persistRecords(
            $records,
            (int) $importModel->id,
            $autoCategorise
        );

        if ($mapping && $columns) {
            // Remembered also when nothing new came in: the same bank file next
            // month must not ask for the columns all over again.
            $this->rememberMapping($columns, $fileExtension, $mapping, $accountId, $skipRows, $inspector);
        }

        if ($imported === 0 && $duplicates > 0) {
            // Every row was already stored (the same export imported twice).
            // Nothing was duplicated and nothing failed: saying "error, check the
            // file" here sent the user looking for a problem that did not exist.
            // The imports row is still dropped: an import that brought nothing
            // has no place in the history.
            $importModel->forceDelete();

            return response()->json([
                'message' => $duplicates === 1
                    ? 'Nothing new: that movement is already there'
                    : "Nothing new: those $duplicates movements are already there",
                'imported' => 0,
                'skipped' => $skipped,
                'duplicates' => $duplicates,
                'auto_categorised' => 0,
                'unknown' => 0,
                'rows_left_out' => count($skipRows),
                'already_there' => true,
            ]);
        }

        if ($imported === 0) {
            // Not one row could be read (a mapping that does not fit the file):
            // this one IS a failure.
            $importModel->forceDelete();

            return response()->json(['error' => self::MESSAGE_SAVE_FAILED], 500);
        }

        $message = 'File uploaded successfully';
        if ($skipped > 0) {
            $parts = [];
            if ($duplicates > 0) {
                $parts[] = $duplicates === 1 ? '1 duplicate' : "$duplicates duplicates";
            }
            if ($skipped - $duplicates > 0) {
                $parts[] = ($skipped - $duplicates) . ' unreadable';
            }
            $message .= ' (' . $imported . ' imported, ' . implode(' + ', $parts) . ' row(s) skipped)';
        }

        return response()->json([
            'message' => $message,
            'imported' => $imported,
            'skipped' => $skipped,
            'duplicates' => $duplicates,
            'auto_categorised' => $autoCategorised,
            'unknown' => $unknown,
            'rows_left_out' => count($skipRows),
        ]);
    }

    /**
     * Saves the parsed records and grows the learned rules. Shared by the
     * standard files and by the ones the user mapped, so both behave the same.
     *
     * @return array{0:int,1:int,2:int,3:int,4:int} imported, skipped, duplicates, auto categorised, unknown
     */
    private function persistRecords(array $records, int $importId, bool $autoCategorise): array
    {
        $imported = 0;
        $skipped = 0;
        // Counted apart from the rows that could not be read: re-importing the
        // same export is not a failure, a broken row is.
        $duplicates = 0;
        $autoCategorised = 0;
        $unknown = 0;
        // One query, not one per row.
        $fallbackId = $this->fallbackCategoryId((int) auth()->user()->id);
        $classifier = $this->classifierForBatch($records);

        foreach ($records as $record) {
            try {
                // code is unique (records_code_unique) to prevent duplicate
                // imports — skip rows that already exist instead of failing the
                // whole file.
                if (Record::where('user_id', $record->user_id)->where('code', $record->code)->exists()) {
                    $skipped++;
                    $duplicates++;
                    continue;
                }
                $record->import_id = $importId;

                if (! $record->category_id) {
                    // Two things have to agree before the app files a movement on
                    // its own: the box on the import screen, and the user's own
                    // switch in the settings (which arrives off). With either of
                    // them off, the movement keeps the fallback category and
                    // nothing is decided for him.
                    $useLearnedRules = $autoCategorise && (bool) auth()->user()->auto_categorize_enabled;

                    $prediction = $useLearnedRules
                        ? (array) $classifier->classify(
                            (int) $record->user_id,
                            $record->name ?: $record->description
                        )
                        : [];
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
                // Imported rows carry the user's own categories, so this is also
                // the evidence that grows learned rules.
                $record->merchant_key = $classifier->merchantKey($record->name ?: $record->description);
                $record->save();
                $imported++;

                // The wording is registered as seen: it is what the categoriser
                // suggests, and what the user says yes or no to. Whether it is
                // worth a rule of its own is decided in CategoryLearner, which
                // will not turn the fallback category into one.
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

        return [$imported, $skipped, $duplicates, $autoCategorised, $unknown];
    }

    /**
     * Classifier primed with the texts of the file being imported plus the
     * movements already on the account.
     *
     * The words a bank repeats in every line ("card payment", the account
     * holder, the city) are not part of anybody's name: reading them makes the
     * key the bank's wording instead of the merchant's, and every shop ends up
     * sharing one key. Nothing is listed per bank: the normaliser works it out
     * from the texts in front of it.
     *
     * @param array<int,\App\Models\Record> $records
     */
    private function classifierForBatch(array $records): CategoryClassifier
    {
        $texts = [];
        foreach ($records as $record) {
            $text = trim((string) ($record->name ?: $record->description));
            if ($text !== '') {
                $texts[] = $text;
            }
        }

        $normaliser = app(CategoryCorpus::class)
            ->normalizerFor((int) auth()->user()->id, null, $texts);

        return new CategoryClassifier($normaliser);
    }

    /**
     * Builds records from a raw table using the mapping the user confirmed.
     * This is what makes a bank export importable without reshaping it.
     */
    private function extractWithMapping(array $columns, array $rows, array $mapping, ?int $accountId): array
    {
        $user = auth()->user();
        $columnCount = count($columns);
        $records = [];

        $pick = function (array $row, string $field) use ($mapping, $columnCount) {
            if (! array_key_exists($field, $mapping) || $mapping[$field] === null || $mapping[$field] === '') {
                return null;
            }
            $index = (int) $mapping[$field];
            if ($index < 0 || $index >= $columnCount) {
                return null;
            }
            $value = $row[$index] ?? null;

            return $value === '' ? null : $value;
        };

        // Categories are only ever accepted from the user's own data.
        $ownCategories = Category::where('user_id', $user->id)->pluck('id')->all();

        // The name of the amount column decides when the file carries no type:
        // a column of "Cargo" / "Debe" is money going out whatever its sign.
        $amountHeader = $this->mappedHeader($columns, $mapping, 'amount');

        foreach ($rows as $row) {
            try {
                $date = $this->parseDate($pick($row, 'date'));
                $name = trim((string) ($pick($row, 'name') ?? ''));
                $amountOut = $this->parseAmount($pick($row, 'amount'));
                $amountIn = $this->parseAmount($pick($row, 'amount_in'));

                if ($date === null || $name === '' || ($amountOut === null && $amountIn === null)) {
                    throw new \InvalidArgumentException('Row without date, name or amount');
                }

                [$amount, $type] = $this->resolveAmountAndType(
                    $amountOut,
                    $amountIn,
                    $pick($row, 'type'),
                    $amountHeader
                );

                $fromAccount = $this->positiveInt($pick($row, 'from_account_id'));
                $toAccount = $this->positiveInt($pick($row, 'to_account_id'));

                // A bank export carries no BudgetBee account: the one the user
                // picked on screen is the counterpart of every movement. It goes
                // in from_account_id even for an income, because that column is
                // NOT NULL in this schema (same as payments do).
                if ($accountId) {
                    $fromAccount = $accountId;
                    $toAccount = $type === 'transfer' ? $toAccount : null;
                }

                // Nothing to hang the movement on: skip it instead of failing
                // the whole file.
                if (! $fromAccount && ! $toAccount) {
                    throw new \InvalidArgumentException('Row without account');
                }

                $categoryId = $this->positiveInt($pick($row, 'category_id'));
                if ($categoryId && ! in_array($categoryId, $ownCategories, true)) {
                    $categoryId = null;
                }

                $record = new Record([
                    'user_id' => $user->id,
                    'date' => $date,
                    'from_account_id' => $fromAccount,
                    'to_account_id' => $toAccount,
                    'category_id' => $categoryId,
                    'name' => $name,
                    'type' => $type,
                    'amount' => $amount,
                    'rate' => $this->parseAmount($pick($row, 'rate')) ?? 1,
                ]);

                $code = $user->id . $record->date . $record->from_account_id . $record->to_account_id
                    . $record->category_id . $record->name . $record->type . $record->amount . $record->rate;
                $record->code = hash('sha256', $code);

                $records[] = $record;
            } catch (Exception $e) {
                // One bad row must not discard the whole file.
                Log::warning('Import row skipped: ' . $e->getMessage());
            }
        }

        return $records;
    }

    /**
     * Money in the file, in BudgetBee terms: expense is a NEGATIVE amount going
     * out of an account, income is positive. Bank export columns do not agree
     * with each other, so both a signed amount and the Cargo/Abono pair work.
     *
     * When the file carries no type column the SIGN decides: a positive figure
     * in the single amount column is money coming in (a salary, a transfer
     * received). Reading every positive row as an expense turned those rows
     * into expenses silently. The exception is a column whose own name says
     * money out ("Cargo", "Debe", "Débito"): there a positive figure is the
     * usual way of writing the charge.
     *
     * @return array{0:float,1:string} amount, type
     */
    private function resolveAmountAndType(?float $amountOut, ?float $amountIn, $typeValue, ?string $amountHeader = null): array
    {
        $declared = $this->normaliseType($typeValue);

        if ($amountIn !== null && $amountIn != 0.0) {
            return [abs($amountIn), 'income'];
        }

        if ($amountOut === null || $amountOut == 0.0) {
            throw new \InvalidArgumentException('Row without amount');
        }

        if ($declared === 'income') {
            return [abs($amountOut), 'income'];
        }
        if ($declared === 'expense' || $this->looksLikeMoneyOut($amountHeader)) {
            return [-abs($amountOut), 'expense'];
        }

        return $amountOut < 0 ? [$amountOut, 'expense'] : [abs($amountOut), 'income'];
    }

    /** Header of the column the user mapped to a field, when there is one. */
    private function mappedHeader(array $columns, array $mapping, string $field): ?string
    {
        $index = $mapping[$field] ?? null;
        if ($index === null || $index === '') {
            return null;
        }

        $index = (int) $index;

        return $index >= 0 && $index < count($columns) ? (string) $columns[$index] : null;
    }

    /** A column named "Cargo", "Debe", "Débito"… is money going out. */
    private function looksLikeMoneyOut(?string $header): bool
    {
        if ($header === null || trim($header) === '') {
            return false;
        }

        $label = strtolower(trim($header));
        $label = strtr($label, ['á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u']);
        $out = ['cargo', 'debe', 'debito', 'adeudo', 'gasto', 'salida', 'pago', 'retirada', 'debit', 'money out'];

        foreach ($out as $word) {
            if ($label === $word || preg_match('/\b' . preg_quote($word, '/') . '\b/u', $label)) {
                return true;
            }
        }

        return false;
    }

    private function normaliseType($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $type = strtolower(trim((string) $value));
        $income = ['income', 'ingreso', 'abono', 'haber', 'credito', 'credit', 'entrada', 'h', 'c'];
        $expense = ['expense', 'gasto', 'cargo', 'debe', 'debito', 'debit', 'salida', 'd', 'p'];

        if (in_array($type, $income, true)) {
            return 'income';
        }
        if (in_array($type, $expense, true)) {
            return 'expense';
        }

        return null;
    }

    /**
     * Understands 1234.56, 1.234,56, 1,234.56 and "1 234,56 €".
     */
    private function parseAmount($value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }
        if (is_int($value) || is_float($value)) {
            return (float) $value;
        }

        $clean = str_replace([' ', "\u{00A0}", '€', '$', 'EUR', 'eur'], '', (string) $value);
        $comma = strrpos($clean, ',');
        $dot = strrpos($clean, '.');

        if ($comma !== false && $dot !== false) {
            if ($comma > $dot) {
                $clean = str_replace('.', '', $clean);
                $clean = str_replace(',', '.', $clean);
            } else {
                $clean = str_replace(',', '', $clean);
            }
        } elseif ($comma !== false) {
            $clean = str_replace(',', '.', $clean);
        }

        $clean = preg_replace('/[^0-9.\-]/', '', $clean);

        return is_numeric($clean) ? (float) $clean : null;
    }

    /**
     * Understands dd/mm/yyyy, yyyy-mm-dd, yyyy-mm-dd hh:mm:ss and the numeric
     * serial dates Excel keeps inside spreadsheets.
     */
    private function parseDate($value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (is_int($value) || is_float($value)) {
            $serial = (float) $value;
            if ($serial > 20000 && $serial < 60000) {
                return SpreadsheetDate::excelToDateTimeObject($serial)->format('Y-m-d H:i:s');
            }
        }

        $text = trim((string) $value);

        if (preg_match('#^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})#', $text, $m)) {
            return sprintf('%04d-%02d-%02d 00:00:00', (int) $m[1], (int) $m[2], (int) $m[3]);
        }

        if (preg_match('#^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})#', $text, $m)) {
            $year = (int) $m[3];
            if ($year < 100) {
                $year += 2000;
            }

            return sprintf('%04d-%02d-%02d 00:00:00', $year, (int) $m[2], (int) $m[1]);
        }

        $timestamp = strtotime($text);

        return $timestamp ? date('Y-m-d H:i:s', $timestamp) : null;
    }

    private function positiveInt($value): ?int
    {
        if ($value === null || $value === '' || ! is_numeric($value)) {
            return null;
        }
        $int = (int) $value;

        return $int > 0 ? $int : null;
    }

    private function decodeMapping($raw): ?array
    {
        if (! is_string($raw) || trim($raw) === '') {
            return null;
        }

        $mapping = json_decode($raw, true);
        if (! is_array($mapping)) {
            return null;
        }

        // Only field => column index pairs, and only known fields.
        $clean = [];
        foreach ($mapping as $field => $index) {
            if (in_array($field, ImportFileInspector::FIELDS, true) && $index !== null && $index !== '') {
                $clean[$field] = (int) $index;
            }
        }

        return $clean ?: null;
    }

    /** The account a bank export belongs to: only the user's own are accepted. */
    private function resolveAccountId($value): ?int
    {
        $id = $this->positiveInt($value);
        if (! $id) {
            return null;
        }

        return Account::where('user_id', auth()->user()->id)->whereKey($id)->exists() ? $id : null;
    }

    /** The canonical fields in the canonical order: the standard file layout. */
    private function identityMapping(array $columns): array
    {
        $mapping = [];
        foreach (ImportFileInspector::FIELDS as $index => $field) {
            if (array_key_exists($index, $columns)) {
                $mapping[$field] = $index;
            }
        }

        return $mapping;
    }

    private function signature(array $columns, ImportFileInspector $inspector): string
    {
        $normalised = array_map(fn ($column) => $inspector->normalise((string) $column), $columns);

        return hash('sha256', implode('|', $normalised));
    }

    private function savedMapping(array $columns, ImportFileInspector $inspector): ?ImportColumnMapping
    {
        return ImportColumnMapping::where('user_id', auth()->user()->id)
            ->where('signature', $this->signature($columns, $inspector))
            ->first();
    }

    private function rememberMapping(
        array $columns,
        string $format,
        array $mapping,
        ?int $accountId,
        array $skipRows,
        ImportFileInspector $inspector
    ): void {
        ImportColumnMapping::updateOrCreate(
            [
                'user_id' => auth()->user()->id,
                'signature' => $this->signature($columns, $inspector),
            ],
            [
                'file_format' => $format,
                'mapping' => $mapping,
                // Kept next to the mapping: the same export carries the same
                // junk lines (holder, balance, total) every month.
                'skip_rows' => $skipRows ?: null,
                'account_id' => $accountId,
            ]
        );
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
     * Every way the upload itself can go wrong, answered with a sentence the user
     * can act on. Returns null when the file is fine to work with.
     */
    private function checkFile(Request $request): ?JsonResponse
    {
        if (! $request->hasFile('file')) {
            // An empty POST is what a file over the server limit looks like from
            // here, and also a form sent with nothing chosen.
            return response()->json(['error' => self::MESSAGE_NO_FILE], 422);
        }

        $file = $request->file('file');

        if (! $file->isValid()) {
            return response()->json(['error' => $this->uploadErrorMessage($file)], 422);
        }

        if ($file->getSize() > self::MAX_FILE_BYTES) {
            return response()->json(['error' => self::MESSAGE_TOO_BIG], 422);
        }

        if (! in_array(strtolower($file->getClientOriginalExtension()), self::VALID_EXTENSIONS, true)) {
            return response()->json(['error' => self::MESSAGE_BAD_TYPE], 422);
        }

        return null;
    }

    /**
     * Why PHP could not take the file, in words: a size limit, a partial upload,
     * a directory it could not write to.
     */
    private function uploadErrorMessage(UploadedFile $file): string
    {
        return match ($file->getError()) {
            UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => self::MESSAGE_TOO_BIG,
            UPLOAD_ERR_PARTIAL => 'The file arrived only partly. Try uploading it again.',
            UPLOAD_ERR_NO_FILE => self::MESSAGE_NO_FILE,
            UPLOAD_ERR_NO_TMP_DIR, UPLOAD_ERR_CANT_WRITE => 'The server could not store the file. Try again in a moment.',
            default => 'The file could not be read. Try uploading it again.',
        };
    }

    /**
     * Where an uncategorised movement lands when nothing else matches.
     */
    private function fallbackCategoryId(int $userId): ?int
    {
        return app(\App\Services\Categorization\FallbackCategory::class)->idFor($userId);
    }
}
