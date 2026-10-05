<?php

namespace Tests\Unit;

use App\Services\Import\ImportFileInspector;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Tests\TestCase;

/**
 * The column detector is what decides which column holds what: a wrong guess
 * imports the wrong numbers, so the greedy assignment and the standard-file
 * check are pinned here.
 *
 * The file contents are made up: the point is the shape of the export (a
 * preamble, the header row a few lines down, columns in an odd order), not
 * anybody's movements.
 */
class ImportFileInspectorTest extends TestCase
{
    private function upload(string $content, string $name): UploadedFile
    {
        $path = tempnam(sys_get_temp_dir(), 'insp') . '_' . $name;
        file_put_contents($path, $content);

        return new UploadedFile($path, $name, null, null, true);
    }

    public function test_it_maps_a_spanish_bank_export(): void
    {
        $csv = "Fecha operación;Fecha valor;Concepto;Importe;Cargo;Abono;Saldo\n"
            . "02/10/2026;02/10/2026;TRANSFER OUT;-150,00;150,00;;2.350,00\n"
            . "01/10/2026;02/10/2026;SALARY OCTOBER;1.850,00;;1.850,00;4.200,00\n"
            . "30/09/2026;30/09/2026;CARD PURCHASE ACME MART;-87,45;87,45;;2.500,00\n";

        $data = (new ImportFileInspector())->inspect($this->upload($csv, 'bank.csv'));

        $this->assertSame(3, $data['row_count']);
        $this->assertFalse($data['standard']);
        $this->assertSame(0, $data['suggested']['date']);
        $this->assertSame(2, $data['suggested']['name']);
        $this->assertSame(3, $data['suggested']['amount']);
        $this->assertSame(5, $data['suggested']['amount_in']);
    }

    /**
     * "Concepto" must be the description: it used to be stolen by
     * to_account_id, because the header contains "to".
     */
    public function test_a_header_containing_to_is_never_taken_as_account(): void
    {
        $csv = "Fecha;Concepto;Importe\n"
            . "02/10/2026;FIRST PAYMENT;-10,00\n"
            . "03/10/2026;SECOND PAYMENT;-20,00\n"
            . "04/10/2026;THIRD PAYMENT;-30,00\n";

        $suggested = (new ImportFileInspector())->inspect($this->upload($csv, 'trick.csv'))['suggested'];

        $this->assertSame(1, $suggested['name']);
        $this->assertArrayNotHasKey('to_account_id', $suggested);
        $this->assertArrayNotHasKey('from_account_id', $suggested);
    }

    public function test_a_json_with_odd_keys_is_mapped_too(): void
    {
        $json = json_encode([
            ['Fecha' => '2026-10-02', 'Importe' => '-20,00', 'Texto' => 'FIRST PAYMENT'],
            ['Fecha' => '2026-10-03', 'Importe' => '-30,00', 'Texto' => 'SECOND PAYMENT'],
            ['Fecha' => '2026-10-04', 'Importe' => '-40,00', 'Texto' => 'THIRD PAYMENT'],
        ]);

        $suggested = (new ImportFileInspector())->inspect($this->upload($json, 'odd.json'))['suggested'];

        $this->assertSame(0, $suggested['date']);
        $this->assertSame(2, $suggested['name']);
        $this->assertSame(1, $suggested['amount']);
    }

    public function test_the_template_columns_are_standard(): void
    {
        $inspector = new ImportFileInspector();

        $this->assertTrue($inspector->isStandard([
            'date', 'from_account_id', 'to_account_id', 'type',
            'category_id', 'name', 'amount', 'rate',
        ]));
        $this->assertFalse($inspector->isStandard(['Fecha', 'Importe', 'Concepto']));
        $this->assertFalse($inspector->isStandard([]));
    }

    public function test_it_detects_the_delimiter_and_reads_windows_1252(): void
    {
        $inspector = new ImportFileInspector();

        $this->assertSame(';', $inspector->detectDelimiter("a;b;c\n1;2;3\n"));
        $this->assertSame(',', $inspector->detectDelimiter("a,b,c\n1,2,3\n"));
        $this->assertSame("\t", $inspector->detectDelimiter("a\tb\tc\n1\t2\t3\n"));

        $cp1252 = "Fecha;Concepto;Importe\n02/10/2026;CAF\xc9 PURCHASE;-10,00\n";
        $this->assertStringContainsString('CAFÉ', $inspector->toUtf8($cp1252));
    }

    /** A bank export opens with the account, the holder and the balance: the
     *  header is rows below, and until now everything was read as «(column N)». */
    public function test_it_finds_the_header_row_under_a_preamble(): void
    {
        $csv = "Statement;EXAMPLE BANK;;\n"
            . "Account;ES00 0000 0000 0000 0000 0000;;\n"
            . "Holder;JOHN DOE;;\n"
            . "Movements;;;\n"
            . "FECHA OPERACIÓN;FECHA VALOR;CONCEPTO;IMPORTE EUR;SALDO\n"
            . "01/10/2026;01/10/2026;MOBILE PAYMENT ACME MART;-271.19;1849.01\n"
            . "02/10/2026;02/10/2026;UTILITY BILL NORTHWIND;-15;2120.2\n"
            . "03/10/2026;03/10/2026;CARD SETTLEMENT;-27.13;2140.2\n";

        $data = (new ImportFileInspector())->inspect($this->upload($csv, 'statement.csv'));

        $this->assertSame(5, $data['header_row']);
        $this->assertSame(3, $data['row_count']);
        $this->assertSame(
            ['FECHA OPERACIÓN', 'FECHA VALOR', 'CONCEPTO', 'IMPORTE EUR', 'SALDO'],
            $data['columns']
        );
        $this->assertSame(0, $data['suggested']['date']);
        $this->assertSame(2, $data['suggested']['name']);
        $this->assertSame(3, $data['suggested']['amount']);
    }

    /** The same thing in the Excel the bank hands out. */
    public function test_it_finds_the_header_row_in_a_bank_xlsx(): void
    {
        $path = tempnam(sys_get_temp_dir(), 'insp') . '.xlsx';
        $sheet = new Spreadsheet();
        $sheet->getActiveSheet()->fromArray([
            ['ES00 0000 0000 0000 0000 0000', null, '02/10/2026 14:05:32', null, null],
            [null, null, null, null, null],
            ['Holder', 'JOHN DOE', '1.849,01 EUR', null, null],
            ['Movements', null, null, null, null],
            [null, null, null, null, null],
            ['FECHA OPERACIÓN', 'FECHA VALOR', 'CONCEPTO', 'IMPORTE EUR', 'SALDO'],
            ['01/10/2026', '01/10/2026', 'MOBILE PAYMENT ACME MART', '-271.19', '1849.01'],
            ['01/10/2026', '01/10/2026', 'UTILITY BILL NORTHWIND', '-15', '2120.2'],
            ['01/10/2026', '01/10/2026', 'CARD SETTLEMENT', '-27.13', '2140.2'],
        ], null, 'A1');
        (new Xlsx($sheet))->save($path);

        $data = (new ImportFileInspector())->inspect(
            new UploadedFile($path, 'example-bank.xlsx', null, null, true)
        );

        // The number is the real one: blank rows count, as in Excel.
        $this->assertSame(6, $data['header_row']);
        $this->assertSame(['FECHA OPERACIÓN', 'FECHA VALOR', 'CONCEPTO', 'IMPORTE EUR', 'SALDO'], $data['columns']);
        $this->assertSame(3, $data['row_count']);
        $this->assertSame(0, $data['suggested']['date']);
        $this->assertSame(2, $data['suggested']['name']);
        $this->assertSame(3, $data['suggested']['amount']);

        unlink($path);
    }

    /** No header at all: name the columns by position and lose no movement. */
    public function test_a_file_with_no_header_keeps_every_row(): void
    {
        $csv = "01/10/2026;CARD PURCHASE ACME MART;-87,45\n"
            . "02/10/2026;SALARY OCTOBER;1850,00\n"
            . "03/10/2026;CHEMIST SHOP;-12,30\n";

        $data = (new ImportFileInspector())->inspect($this->upload($csv, 'no_header.csv'));

        $this->assertNull($data['header_row']);
        $this->assertSame(['(column 1)', '(column 2)', '(column 3)'], $data['columns']);
        $this->assertSame(3, $data['row_count']);
        // Even with no names, the content says which column is which.
        $this->assertSame(0, $data['suggested']['date']);
        $this->assertSame(1, $data['suggested']['name']);
        $this->assertSame(2, $data['suggested']['amount']);
    }

    public function test_names_are_normalised_for_comparison(): void
    {
        $inspector = new ImportFileInspector();

        $this->assertSame('fecha operacion', $inspector->normalise('Fecha operación'));
        $this->assertSame('fecha operacion', $inspector->normalise('FECHA_OPERACION'));
        $this->assertSame('importe', $inspector->normalise('  Importe  '));
    }

    /**
     * Bank files carry lines that are not movements: the holder, the balance and
     * a total at the end. The user ticks them on screen and they must not be
     * imported, while the movements around them come in whole.
     */
    public function test_the_user_can_leave_rows_out_of_the_file(): void
    {
        $csv = "Statement;EXAMPLE BANK;;\n"
            . "Account;ES00 0000 0000 0000 0000 0000;;\n"
            . "Holder;JOHN DOE;;\n"
            . "Movements;;;\n"
            . "FECHA OPERACIÓN;FECHA VALOR;CONCEPTO;IMPORTE EUR;SALDO\n"
            . "01/10/2026;01/10/2026;MOBILE PAYMENT ACME MART;-271.19;1849.01\n"
            . "02/10/2026;02/10/2026;UTILITY BILL NORTHWIND;-15;2120.2\n"
            . "03/10/2026;03/10/2026;CARD SETTLEMENT;-27.13;2140.2\n"
            . "TOTAL ROWS;;;-313,32;;\n";

        // Row 9 is the account total: it is not a movement.
        $data = (new ImportFileInspector())->inspect($this->upload($csv, 'statement.csv'), [9]);

        $this->assertSame(5, $data['header_row']);
        $this->assertSame(3, $data['row_count']);
        $this->assertSame([6, 7, 8], $data['row_numbers']);
        $this->assertSame([9], $data['skip_rows']);
        $this->assertSame(1, $data['skipped_count']);
        // The last rows of the file are shown as well, with their real numbers,
        // so the total can be ticked where it is.
        $this->assertSame([6, 7, 8], $data['preview_tail_row_numbers']);
        // The preview holds the rows that will really be imported, numbered as
        // they are in the file (the header itself is not a movement).
        $this->assertSame([6, 7, 8], $data['preview_row_numbers']);
    }

    /**
     * Leaving the junk out must not renumber the file: the header keeps the row
     * the user sees in their spreadsheet, and so does every movement.
     */
    public function test_leaving_rows_out_keeps_the_numbers_of_the_file(): void
    {
        $csv = "Statement;EXAMPLE BANK;;\n"
            . "Account;ES00 0000 0000 0000 0000 0000;;\n"
            . "Holder;JOHN DOE;;\n"
            . "Movements;;;\n"
            . "FECHA OPERACIÓN;FECHA VALOR;CONCEPTO;IMPORTE EUR;SALDO\n"
            . "01/10/2026;01/10/2026;MOBILE PAYMENT ACME MART;-271.19;1849.01\n"
            . "02/10/2026;02/10/2026;UTILITY BILL NORTHWIND;-15;2120.2\n";

        // The whole preamble is left out, header included.
        $data = (new ImportFileInspector())->inspect($this->upload($csv, 'preamble.csv'), [1, 2, 3, 4]);

        $this->assertSame(5, $data['header_row']);
        $this->assertSame([6, 7], $data['row_numbers']);
        $this->assertSame(2, $data['row_count']);
        // The columns are still recognised without the preamble rows.
        $this->assertSame(0, $data['suggested']['date']);
        $this->assertSame(2, $data['suggested']['name']);
        $this->assertSame(3, $data['suggested']['amount']);
    }

    /** Rows written the way a person writes them: "1-4, 9". */
    public function test_skip_rows_accepts_ranges_and_ignores_rubbish(): void
    {
        $inspector = new ImportFileInspector();

        $this->assertSame([1, 2, 3, 4, 9], $inspector->parseSkipRows('1-4, 9'));
        $this->assertSame([1, 2, 3, 10, 11, 12], $inspector->parseSkipRows('1-3, 12-10, x, 0, -5'));
        $this->assertSame([7], $inspector->parseSkipRows('[7]'));
        $this->assertSame([2, 5], $inspector->parseSkipRows('5 2 2'));
        $this->assertSame([], $inspector->parseSkipRows(''));
        $this->assertSame([], $inspector->parseSkipRows(null));
    }
}
