<?php

namespace App\Services\Import;

use Exception;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;

/**
 * Reads an uploaded movements file and works out which column holds what.
 *
 * A user should be able to import the file their bank hands them (csv, json,
 * xls, xlsx) without reshaping it first: this service opens the file, lists its
 * columns, keeps a small preview and proposes a column -> field mapping using
 * both the header names and the content of the cells.
 *
 * It never writes to the database and never imports anything: it only reads and
 * proposes. The import itself stays in ImportController.
 */
class ImportFileInspector
{
    /** Preview rows handed to the mapping screen. */
    public const PREVIEW_ROWS = 10;

    /** Rows from the END of the file shown as well: bank exports close with a total. */
    public const PREVIEW_TAIL_ROWS = 5;

    /**
     * Canonical fields of a movement: the first EIGHT, in this order, are the
     * downloadable template. `amount_in` comes after them because it is an
     * extra for bank exports that split the money into two columns
     * (Cargo / Abono) instead of one signed amount.
     */
    public const FIELDS = [
        'date', 'from_account_id', 'to_account_id', 'type', 'category_id',
        'name', 'amount', 'rate', 'amount_in',
    ];

    /** Fields a file has to provide for an import to make sense. */
    public const REQUIRED = ['date', 'name', 'amount'];

    /**
     * Fields worth guessing from the CONTENT of the cells. Account, type,
     * category and rate are never guessed: a wrong guess there imports the
     * wrong numbers, while a wrong date/name/amount is obvious on screen.
     * `amount_in` is not here either: a second numeric column may perfectly be
     * the balance («SALDO»), and taking it as money in turns every movement of
     * the file into an income. It is only accepted when the header names it.
     */
    private const CONTENT_FIELDS = ['date', 'name', 'amount'];

    /**
     * Words that disqualify a column for a field, however the cells look: the
     * balance of the account is a number like any other.
     */
    private const NOT_COLUMNS = [
        'amount' => ['saldo', 'balance', 'disponible', 'saldo contable'],
        'amount_in' => ['saldo', 'balance', 'disponible', 'saldo contable'],
    ];

    private const SYNONYMS = [
        'date' => ['date', 'fecha', 'fecha valor', 'fecha operacion', 'fecha contable',
            'fecha de operacion', 'fecha movimiento', 'data', 'booking date', 'value date',
            'fecha cargo', 'fecha abono', 'dia'],
        'name' => ['name', 'nombre', 'descripcion', 'description', 'concepto', 'text',
            'texto', 'detalle', 'detalle del movimiento', 'merchant', 'comercio',
            'beneficiario', 'observaciones', 'movimiento', 'operacion', 'payee',
            'reference', 'referencia', 'concept', 'descripcion del movimiento'],
        'amount' => ['amount', 'importe', 'cantidad', 'monto', 'value', 'valor', 'cargo',
            'debe', 'importe cargo', 'total', 'importe eur', 'amount eur', 'cuantia',
            'importe en eur', 'euros'],
        'amount_in' => ['abono', 'haber', 'ingreso', 'credito', 'credit', 'importe abono',
            'entrada', 'amount in', 'ingresos'],
        'type' => ['type', 'tipo', 'tipo movimiento', 'tipo de movimiento', 'sign',
            'signo', 'clase', 'naturaleza'],
        'category_id' => ['category', 'categoria', 'categoria id', 'category id'],
        'from_account_id' => ['from_account_id', 'from account', 'cuenta origen',
            'cuenta de origen', 'from', 'origen', 'cuenta'],
        'to_account_id' => ['to_account_id', 'to account', 'cuenta destino', 'to',
            'destino'],
        'rate' => ['rate', 'tasa', 'tipo de cambio', 'exchange rate', 'cambio', 'divisa'],
    ];

    /**
     * @param  array<int,int>  $skipRows  rows of the file (1-based) to leave out
     * @return array{format:string,columns:array,preview:array,preview_row_numbers:array,preview_tail:array,preview_tail_row_numbers:array,rows:array,row_numbers:array,skip_rows:array,skipped_count:int,suggested:array,standard:bool,row_count:int,header_row:?int}
     */
    public function inspect(UploadedFile $file, array $skipRows = []): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $skipRows = $this->cleanSkipRows($skipRows);

        $headerRow = null;
        switch ($extension) {
            case 'json':
                [$columns, $rows] = $this->readJson($file);
                $numbers = range(1, max(count($rows), 1));
                $numbers = array_slice($numbers, 0, count($rows));
                [$rows, $numbers] = $this->dropRows($rows, $numbers, $skipRows);
                break;
            case 'csv':
                [$columns, $rows, $headerRow, $numbers] = $this->splitHeader($this->readCsv($file), $skipRows);
                break;
            case 'xls':
            case 'xlsx':
                [$columns, $rows, $headerRow, $numbers] = $this->splitHeader($this->readSpreadsheet($file), $skipRows);
                break;
            default:
                $columns = [];
                $rows = [];
                $numbers = [];
        }

        $suggested = $this->suggest($columns, $rows);

        return [
            'format' => $extension,
            'columns' => $columns,
            'preview' => array_slice($rows, 0, self::PREVIEW_ROWS),
            'preview_row_numbers' => array_slice($numbers, 0, self::PREVIEW_ROWS),
            // The end of the file too: that is where the account total sits, and
            // it is a row the user has to be able to leave out on screen.
            'preview_tail' => array_slice($rows, -self::PREVIEW_TAIL_ROWS),
            'preview_tail_row_numbers' => array_slice($numbers, -self::PREVIEW_TAIL_ROWS),
            'rows' => $rows,
            'row_numbers' => $numbers,
            'skip_rows' => $skipRows,
            'skipped_count' => count($skipRows),
            'suggested' => $suggested,
            'standard' => $this->isStandard($columns),
            'row_count' => count($rows),
            'header_row' => $headerRow,
        ];
    }

    /**
     * Rows to leave out, written the way a person writes them: "1-5, 8, 20-22"
     * or an array of numbers. Anything that is not a positive number (or a
     * valid range) is ignored instead of failing the import.
     *
     * @param  mixed  $raw
     * @return array<int,int>
     */
    public function parseSkipRows($raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }
        if (is_array($raw)) {
            return $this->cleanSkipRows($raw);
        }
        $decoded = json_decode((string) $raw, true);
        if (is_array($decoded)) {
            return $this->cleanSkipRows($decoded);
        }

        $numbers = [];
        foreach (preg_split('/[,\s;]+/', (string) $raw) ?: [] as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '') {
                continue;
            }
            if (preg_match('/^(\d+)\s*[-–]\s*(\d+)$/', $chunk, $matches)) {
                [$from, $to] = [(int) $matches[1], (int) $matches[2]];
                if ($from > $to) {
                    [$from, $to] = [$to, $from];
                }
                // A range is capped so a typo ("1-99999") cannot build a huge list.
                if ($to - $from > 5000) {
                    $to = $from + 5000;
                }
                for ($i = $from; $i <= $to; $i++) {
                    if ($i > 0) {
                        $numbers[] = $i;
                    }
                }
                continue;
            }
            if (ctype_digit($chunk) && (int) $chunk > 0) {
                $numbers[] = (int) $chunk;
            }
        }

        return $this->cleanSkipRows($numbers);
    }

    /** @return array<int,int> */
    private function cleanSkipRows(array $rows): array
    {
        $clean = [];
        foreach ($rows as $row) {
            $row = (int) $row;
            if ($row > 0 && ! in_array($row, $clean, true)) {
                $clean[] = $row;
            }
        }
        sort($clean);

        return $clean;
    }

    /**
     * Drops the rows the user asked to leave out, keeping every kept row tied to
     * its number IN THE FILE: the screen has to show the number the user sees in
     * Excel, and the import has to drop exactly the rows they ticked.
     *
     * @return array{0:array,1:array}
     */
    private function dropRows(array $rows, array $numbers, array $skipRows): array
    {
        if (empty($skipRows)) {
            return [$rows, $numbers];
        }

        $keptRows = [];
        $keptNumbers = [];
        foreach (array_values($rows) as $i => $row) {
            $number = $numbers[$i] ?? ($i + 1);
            if (in_array((int) $number, $skipRows, true)) {
                continue;
            }
            $keptRows[] = $row;
            $keptNumbers[] = $number;
        }

        return [$keptRows, $keptNumbers];
    }

    /** Leading rows examined when hunting for the header. */
    private const HEADER_SEARCH_ROWS = 15;

    /** Below this, no row looks like a header and the file is taken as headerless. */
    private const MIN_HEADER_SCORE = 6;

    /**
     * Find the row that holds the column names and split the file there.
     *
     * A bank export rarely opens with them: the account number, the holder and
     * the balance come first, and the real header sits under that. Taking row 1
     * as the header leaves every column unnamed («(column 1)», «(column 2)»…)
     * and nothing can be recognised, so the leading rows are scored and the
     * best one wins: labels are text, while the rows around them hold dates,
     * amounts and long account numbers.
     *
     * @param  array<int,int>  $skipRows  rows of the file (1-based) to leave out
     * @return array{0:array,1:array,2:?int,3:array} columns, data rows, header row (1-based, null when there is none), file row of each data row
     */
    public function splitHeader(array $matrix, array $skipRows = []): array
    {
        $matrix = array_values(array_filter($matrix, 'is_array'));

        // Every row keeps the number it has IN THE FILE, so the screen can talk
        // about "row 7" the way the user sees it in their spreadsheet, and so a
        // row can be left out by that number.
        $numbered = [];
        foreach ($matrix as $i => $row) {
            $numbered[] = ['number' => $i + 1, 'row' => $row];
        }
        if ($skipRows) {
            $numbered = array_values(array_filter(
                $numbered,
                fn ($item) => ! in_array((int) $item['number'], $skipRows, true)
            ));
        }
        if (empty($numbered)) {
            return [[], [], null, []];
        }

        $nonEmpty = array_values(array_filter(
            $numbered,
            fn ($item) => count(array_filter($item['row'], fn ($v) => trim((string) $v) !== '')) > 0
        ));
        if (empty($nonEmpty)) {
            return [[], [], null, []];
        }

        $bestIndex = 0;
        $bestScore = PHP_INT_MIN;
        $limit = min(count($nonEmpty), self::HEADER_SEARCH_ROWS);
        for ($i = 0; $i < $limit; $i++) {
            // An empty row scores -10 by itself, so blank rows never win.
            $score = $this->headerRowScore($nonEmpty[$i]['row']);
            if ($score > $bestScore) {
                $bestScore = $score;
                $bestIndex = $i;
            }
        }

        $width = max(array_map(fn ($item) => count($item['row']), $nonEmpty));
        if ($bestScore < self::MIN_HEADER_SCORE) {
            // No header anywhere: name the columns after their position and keep
            // every row as a movement. Losing the first movement to invent a
            // header would be worse, and the screen lets the user say what each
            // column holds anyway.
            [$rows, $numbers] = $this->padNumbered($nonEmpty, $width);

            return [$this->genericNames($width), $rows, null, $numbers];
        }

        $columns = array_map(fn ($v) => trim((string) $v), array_pad($nonEmpty[$bestIndex]['row'], $width, ''));
        $columns = array_map(
            fn ($name, $i) => $name !== '' ? $name : '(column ' . ($i + 1) . ')',
            $columns,
            array_keys($columns)
        );

        $headerNumber = $nonEmpty[$bestIndex]['number'];
        [$rows, $numbers] = $this->padNumbered(array_slice($nonEmpty, $bestIndex + 1), count($columns));

        return [$columns, $rows, $headerNumber, $numbers];
    }

    /** How much a row looks like a header: text counts, numbers count against. */
    private function headerRowScore(array $row): int
    {
        $text = 0;
        $suspicious = 0;
        $filled = 0;
        foreach ($row as $value) {
            $value = trim((string) $value);
            if ($value === '') {
                continue;
            }
            $filled++;
            if ($this->looksNumeric($value) || $this->looksLikeDate($value)
                || preg_match('/\d{6,}/', $value)) {
                $suspicious++;
                continue;
            }
            if (mb_strlen($value) <= 45 && preg_match('/\p{L}/u', $value)) {
                $text++;
            }
        }
        if ($filled < 2) {
            return -10;
        }

        return ($text * 3) + $filled - ($suspicious * 4);
    }

    /** @return array<int,string> */
    private function genericNames(int $width): array
    {
        $names = [];
        for ($i = 0; $i < $width; $i++) {
            $names[] = '(column ' . ($i + 1) . ')';
        }

        return $names;
    }

    /**
     * Every row as wide as the columns, so the mapping screen can index safely,
     * dropping the empty ones and keeping the file row number of each row.
     *
     * @param  array<int,array{number:int,row:array}>  $items
     * @return array{0:array,1:array}
     */
    private function padNumbered(array $items, int $width): array
    {
        $rows = [];
        $numbers = [];
        foreach ($items as $item) {
            $row = $item['row'] ?? [];
            if (! is_array($row) || count(array_filter($row, fn ($v) => trim((string) $v) !== '')) === 0) {
                continue;
            }
            $rows[] = array_slice(array_pad($row, $width, null), 0, $width);
            $numbers[] = $item['number'];
        }

        return [$rows, $numbers];
    }

    /**
     * True when the file uses the canonical column names in the canonical
     * order, i.e. the shape the app handed out as a template. Those files keep
     * importing with no questions asked. A file with only the first eight
     * columns is standard as well: that is the template itself.
     */
    public function isStandard(array $columns): bool
    {
        if (empty($columns)) {
            return false;
        }

        $normalised = array_map(fn ($c) => $this->normalise((string) $c), $columns);
        $canonical = array_map(fn ($f) => $this->normalise($f), self::FIELDS);

        return array_slice($canonical, 0, count($normalised)) === $normalised;
    }

    /**
     * Propose a column for each field: first by the header name, then, for the
     * fields still missing, by what the cells actually contain.
     */
    public function suggest(array $columns, array $rows): array
    {
        // Score every (field, column) pair first and then take the best ones in
        // order: an exact header match must always beat something guessed from
        // the values, no matter which field is looked at first. That is what
        // stops "Concepto" being taken by to_account_id because it contains "to".
        $candidates = [];
        foreach (self::FIELDS as $field) {
            foreach ($columns as $index => $label) {
                if ($this->isForbidden($field, (string) $label)) {
                    continue;
                }
                $score = $this->headerScore($field, (string) $label);
                if ($score > 0) {
                    $candidates[] = ['field' => $field, 'index' => $index, 'score' => $score];
                }
            }
            if (! in_array($field, self::CONTENT_FIELDS, true)) {
                continue;
            }
            // Content is weaker evidence than a header: scaled below 1.0.
            foreach ($columns as $index => $label) {
                if ($this->isForbidden($field, (string) $label)) {
                    continue;
                }
                $score = $this->contentScore($field, $rows, $index) * 0.8;
                if ($score >= 0.70) {
                    $candidates[] = ['field' => $field, 'index' => $index, 'score' => $score];
                }
            }
        }

        usort($candidates, fn ($a, $b) => $b['score'] <=> $a['score']);

        $suggested = [];
        $usedFields = [];
        $usedColumns = [];
        foreach ($candidates as $candidate) {
            if (
                in_array($candidate['field'], $usedFields, true)
                || in_array($candidate['index'], $usedColumns, true)
            ) {
                continue;
            }
            $suggested[$candidate['field']] = $candidate['index'];
            $usedFields[] = $candidate['field'];
            $usedColumns[] = $candidate['index'];
        }

        return $suggested;
    }

    /** Header match: exact synonyms beat a name that merely contains one. */
    private function headerScore(string $field, string $label): float
    {
        $label = $this->normalise($label);
        if ($label === '') {
            return 0.0;
        }
        if (in_array($label, self::SYNONYMS[$field] ?? [], true)) {
            return 1.0;
        }
        foreach (self::SYNONYMS[$field] ?? [] as $word) {
            // Whole words only, and never the short ones: without this,
            // "concepto" matches the "to" of to_account_id and steals the
            // column that should hold the description.
            if (mb_strlen($word) >= 5
                && preg_match('/\b' . preg_quote($word, '/') . '\b/u', $label)) {
                return 0.7;
            }
        }

        return 0.0;
    }

    /**
     * A column the name disqualifies for a field, however the cells look: the
     * balance of the account is a number like any other, and taking it as the
     * amount —or as money in— imports nonsense.
     */
    private function isForbidden(string $field, string $label): bool
    {
        $label = $this->normalise($label);
        if ($label === '') {
            return false;
        }
        foreach (self::NOT_COLUMNS[$field] ?? [] as $word) {
            if (str_contains($label, $word)) {
                return true;
            }
        }

        return false;
    }

    /** How much the values of a column look like the wanted field. */
    private function contentScore(string $field, array $rows, int $index): float
    {
        $values = [];
        foreach ($rows as $row) {
            $value = $row[$index] ?? null;
            if ($value !== null && $value !== '') {
                $values[] = (string) $value;
            }
        }
        if (count($values) < 3) {
            return 0.0;
        }

        $hits = match ($field) {
            'date' => count(array_filter($values, fn ($v) => $this->looksLikeDate($v))),
            'amount', 'amount_in', 'rate' => count(array_filter($values, fn ($v) => $this->looksNumeric($v))),
            'type' => $this->looksCategorical($values) ? count($values) : 0,
            'name' => $this->looksLikeText($values) ? count($values) : 0,
            'category_id' => $this->looksCategorical($values) ? count($values) : 0,
            'from_account_id', 'to_account_id' => 0,
            default => 0,
        };

        return count($values) > 0 ? $hits / count($values) : 0.0;
    }

    private function looksLikeDate(string $value): bool
    {
        if (! preg_match('/^\d{1,4}[-\/.]\d{1,2}[-\/.]\d{1,4}/', trim($value))) {
            return false;
        }

        return strtotime(trim($value)) !== false;
    }

    private function looksNumeric(string $value): bool
    {
        $clean = trim(str_replace([' ', "\u{00A0}", '€', '$', 'EUR'], '', trim($value)));
        if ($clean === '') {
            return false;
        }

        // Spanish (1.234,56) and English (1,234.56) grouping, AND plain numbers
        // with no grouping at all: "1850,00" is what a bank writes most often,
        // and requiring a thousands separator left those cells unrecognised.
        return (bool) preg_match(
            '/^-?(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d{1,2})?$'
            . '|^-?(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?$/',
            $clean
        );
    }

    private function looksCategorical(array $values): bool
    {
        $distinct = array_unique(array_map(fn ($v) => mb_strtolower(trim($v)), $values));

        return count($distinct) <= 4 && count($values) >= 3
            && max(array_map('mb_strlen', $distinct)) <= 12;
    }

    private function looksLikeText(array $values): bool
    {
        $long = array_filter($values, fn ($v) => mb_strlen(trim($v)) >= 6);
        $withSpace = array_filter($values, fn ($v) => str_contains(trim($v), ' '));

        return count($long) >= count($values) * 0.6 && count($withSpace) >= count($values) * 0.3;
    }

    public function normalise(string $value): string
    {
        $value = mb_strtolower(trim($value));
        $value = str_replace(['_', '-', '.', ':'], ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return trim($this->stripAccents($value));
    }

    private function stripAccents(string $value): string
    {
        return strtr($value, [
            'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u',
            'à' => 'a', 'è' => 'e', 'ì' => 'i', 'ò' => 'o', 'ù' => 'u',
            'â' => 'a', 'ê' => 'e', 'î' => 'i', 'ô' => 'o', 'û' => 'u',
            'ç' => 'c', 'ñ' => 'n',
        ]);
    }

    private function readJson(UploadedFile $file): array
    {
        $content = $this->toUtf8(file_get_contents($file->getPathname()) ?: '');
        $data = json_decode($content, true);

        if (! is_array($data)) {
            return [[], []];
        }

        // Either a list of objects or a single object wrapping the list.
        if (isset($data[0]) === false) {
            foreach ($data as $value) {
                if (is_array($value) && isset($value[0])) {
                    $data = $value;
                    break;
                }
            }
        }

        $columns = [];
        foreach ($data as $row) {
            if (! is_array($row)) {
                continue;
            }
            foreach (array_keys($row) as $key) {
                if (! in_array($key, $columns, true)) {
                    $columns[] = $key;
                }
            }
        }

        $rows = [];
        foreach ($data as $row) {
            if (! is_array($row)) {
                continue;
            }
            $line = [];
            foreach ($columns as $key) {
                $value = $row[$key] ?? null;
                $line[] = is_scalar($value) || $value === null ? $value : json_encode($value);
            }
            $rows[] = $line;
        }

        return [$columns, $rows];
    }

    /** All the lines of the file as a plain matrix, header included. */
    private function readCsv(UploadedFile $file): array
    {
        $raw = file_get_contents($file->getPathname()) ?: '';
        if ($raw === '') {
            return [];
        }

        $content = $this->toUtf8($raw);
        $delimiter = $this->detectDelimiter($content);

        $handle = fopen('php://temp', 'r+');
        fwrite($handle, $content);
        rewind($handle);

        $matrix = [];
        while (($line = fgetcsv($handle, 0, $delimiter)) !== false) {
            // Empty lines are kept: they are part of the file and skipping them
            // here would make the header row number differ from the real one.
            $matrix[] = array_map(fn ($v) => trim((string) $v), $line);
        }
        fclose($handle);

        return $matrix;
    }

    /**
     * Bank exports come with ; as often as with , (and some with tabs): pick the
     * delimiter that actually splits the header into more than one column.
     */
    public function detectDelimiter(string $content): string
    {
        // Every line that carries the delimiter, not just the first few: a bank
        // export usually starts with the account, the holder and the period, and
        // the header row can sit well below those. Counting only the first lines
        // found no delimiter at all and fell back to the comma, which then broke
        // the file apart on the decimal comma of every amount.
        $lines = [];
        foreach (preg_split('/\r\n|\n|\r/', $content) ?: [] as $line) {
            $line = trim($line);
            if ($line !== '') {
                $lines[] = $line;
            }
        }
        $lines = array_slice($lines, 0, 200);

        $best = ',';
        $bestScore = 0;
        foreach ([',', ';', "\t", '|'] as $candidate) {
            // How many lines split into the same number of pieces with this
            // delimiter: a real delimiter is the one that repeats the same
            // number of columns line after line.
            $counts = [];
            foreach ($lines as $line) {
                $pieces = substr_count($line, $candidate);
                if ($pieces > 0) {
                    $counts[$pieces] = ($counts[$pieces] ?? 0) + 1;
                }
            }
            if (! $counts) {
                continue;
            }
            arsort($counts);
            $pieces = (int) array_key_first($counts);
            $score = $counts[$pieces] * $pieces;
            if ($score > $bestScore) {
                $bestScore = $score;
                $best = $candidate;
            }
        }

        return $best;
    }

    /** Every non-empty row of the sheet as a matrix, from row 1: the header may be anywhere. */
    private function readSpreadsheet(UploadedFile $file): array
    {
        try {
            $spreadsheet = IOFactory::load($file->getPathname());
        } catch (Exception $e) {
            return [];
        }

        $worksheet = $spreadsheet->getActiveSheet();
        $highestRow = $worksheet->getHighestRow();
        $highestColumn = $worksheet->getHighestColumn();
        $highestColumnIndex = \PhpOffice\PhpSpreadsheet\Cell\Coordinate::columnIndexFromString($highestColumn);

        $matrix = [];
        for ($row = 1; $row <= $highestRow; $row++) {
            $line = [];
            for ($col = 1; $col <= $highestColumnIndex; $col++) {
                $cell = $worksheet->getCell([$col, $row]);
                $value = $cell->getValue();
                if ($value !== null && $value !== '' && SpreadsheetDate::isDateTime($cell)) {
                    $value = SpreadsheetDate::excelToDateTimeObject($value)->format('Y-m-d H:i:s');
                }
                $line[] = $value;
            }
            $matrix[] = $line;
        }

        return $matrix;
    }

    /**
     * Bank exports are frequently Windows-1252: their bytes are not valid UTF-8
     * and accented merchants end up mangled. Convert only when needed.
     */
    public function toUtf8(string $content): string
    {
        // Strip a UTF-8 BOM: it would otherwise become part of the first header.
        if (str_starts_with($content, "\xEF\xBB\xBF")) {
            $content = substr($content, 3);
        }
        if (! mb_check_encoding($content, 'UTF-8')) {
            $content = mb_convert_encoding($content, 'UTF-8', 'Windows-1252');
        }

        return $content;
    }
}
