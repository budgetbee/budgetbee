<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\UserCurrency;
use App\Models\Account;
use App\Models\Category;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx as XlsxWriter;
use PhpOffice\PhpSpreadsheet\Shared\Date as SpreadsheetDate;

class ImportExcelTest extends TestCase
{
    private $user;
    private $account1;
    private $userCurrency1;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        $this->actingAs($this->user);

        $this->userCurrency1 = UserCurrency::factory()->create(['user_id' => $this->user->id]);

        $this->account1 = Account::factory()->create(['user_id' => $this->user->id, 'currency_id' => $this->userCurrency1]);
    }

    public function tearDown(): void
    {
        $this->user->delete();
        $this->account1->delete();
        $this->userCurrency1->delete();

        parent::tearDown();
    }

    private function createXlsxFile(array $rows, bool $useDateSerial = false): UploadedFile
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $sheet->fromArray(
            ['date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'rate'],
            null,
            'A1'
        );

        foreach ($rows as $i => $row) {
            $rowIndex = $i + 2;
            if ($useDateSerial && isset($row['date'])) {
                $excelDate = SpreadsheetDate::PHPToExcel(strtotime($row['date']));
                $sheet->setCellValue('A' . $rowIndex, $excelDate);
                $sheet->getStyle('A' . $rowIndex)
                    ->getNumberFormat()
                    ->setFormatCode('yyyy-mm-dd hh:mm:ss');
            } else {
                $sheet->setCellValue('A' . $rowIndex, $row['date'] ?? '');
            }
            $sheet->setCellValue('B' . $rowIndex, $row['from_account_id'] ?? null);
            $sheet->setCellValue('C' . $rowIndex, $row['to_account_id'] ?? null);
            $sheet->setCellValue('D' . $rowIndex, $row['type'] ?? '');
            $sheet->setCellValue('E' . $rowIndex, $row['category_id'] ?? null);
            $sheet->setCellValue('F' . $rowIndex, $row['name'] ?? '');
            $sheet->setCellValue('G' . $rowIndex, $row['amount'] ?? 0);
            $sheet->setCellValue('H' . $rowIndex, $row['rate'] ?? null);
        }

        $tmpFile = tempnam(sys_get_temp_dir(), 'test_xlsx_');
        $writer = new XlsxWriter($spreadsheet);
        $writer->save($tmpFile);

        $content = file_get_contents($tmpFile);
        unlink($tmpFile);

        Storage::fake('uploads');
        return UploadedFile::fake()->createWithContent('test.xlsx', $content);
    }

    public function testImportSuccessWithStringDates(): void
    {
        $record = Record::factory()->make();
        $category = Category::inRandomOrder()->first();

        $rows = [
            [
                'date' => $record->date,
                'from_account_id' => $this->account1->id,
                'to_account_id' => null,
                'type' => 'expense',
                'category_id' => $category->id,
                'name' => 'Test expense',
                'amount' => 100,
                'rate' => 1,
            ]
        ];

        $file = $this->createXlsxFile($rows, false);

        $response = $this->post('/api/import', ['file' => $file]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'Test expense',
            'amount' => 100,
        ]);
    }

    public function testImportSuccessWithExcelSerialDates(): void
    {
        $record = Record::factory()->make();
        $category = Category::inRandomOrder()->first();

        $rows = [
            [
                'date' => $record->date,
                'from_account_id' => $this->account1->id,
                'to_account_id' => null,
                'type' => 'expense',
                'category_id' => $category->id,
                'name' => 'Test expense serial date',
                'amount' => 200,
                'rate' => 1,
            ]
        ];

        $file = $this->createXlsxFile($rows, true);

        $response = $this->post('/api/import', ['file' => $file]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'Test expense serial date',
            'amount' => 200,
        ]);
    }

    public function testImportSuccessWithNullRate(): void
    {
        $category = Category::inRandomOrder()->first();

        $rows = [
            [
                'date' => '2024-06-25',
                'from_account_id' => $this->account1->id,
                'to_account_id' => null,
                'type' => 'expense',
                'category_id' => $category->id,
                'name' => 'Test null rate',
                'amount' => 50,
                'rate' => null,
            ]
        ];

        $file = $this->createXlsxFile($rows, false);

        $response = $this->post('/api/import', ['file' => $file]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'Test null rate',
            'amount' => 50,
            'rate' => 1,
        ]);
    }
}
