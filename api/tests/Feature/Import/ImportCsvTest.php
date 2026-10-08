<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\CategoryRule;
use App\Models\ParentCategory;
use App\Models\Import;
use App\Models\Record;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use App\Services\Categorization\CategoryClassifier;
use App\Services\Categorization\CategoryLearner;
use Illuminate\Support\Facades\Storage;

/**
 * CSV: the file the banks hand out. It must behave exactly like the Excel one:
 * straight in when it follows the standard layout, and through the column
 * mapping when it does not.
 *
 * The contents are made up: real exports are nobody's business in a test file.
 */
class ImportCsvTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123', 'auto_categorize_enabled' => true]);
        $this->actingAs($this->user);

        $this->userCurrency = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'currency_id' => $this->userCurrency->id,
        ]);
    }

    public function tearDown(): void
    {
        Record::where('user_id', $this->user->id)->delete();
        $this->account->delete();
        $this->userCurrency->delete();
        $this->user->delete();

        parent::tearDown();
    }

    /**
     * A bank export as it comes: Windows-1252 and ";" separated, with the
     * account and the holder on top and a total at the bottom.
     */
    private function bankCsv(): UploadedFile
    {
        $csv = "Cuenta;ES00 0000 0000 0000 0000 0000\n"
            . "Titular;JOHN DOE\n"
            . "Fecha;Concepto;Importe;Saldo\n"
            . "01/09/2026;OPENING BALANCE;0,00;2.500,00\n"
            . "02/09/2026;CARD PURCHASE ACME MART;-45,30;2.454,70\n"
            . "03/09/2026;SALARY SEPTEMBER;1.850,00;4.304,70\n"
            . "05/09/2026;TAX REFUND;120,00;4.424,70\n"
            . "07/09/2026;POWER BILL NORTHWIND;-78,12;4.346,58\n"
            . "TOTAL;5 rows\n";

        Storage::fake('uploads');

        return UploadedFile::fake()->createWithContent(
            'statement.csv',
            mb_convert_encoding($csv, 'Windows-1252', 'UTF-8')
        );
    }

    private function standardCsv(): UploadedFile
    {
        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n"
            . "2026-09-01,{$this->account->id},,expense,,Supermarket purchase,45.30,1\n"
            . "2026-09-02,{$this->account->id},,income,,Monthly salary,1850.00,1\n"
            . "2026-09-03,{$this->account->id},,expense,,Power bill,78.12,1\n";

        Storage::fake('uploads');

        return UploadedFile::fake()->createWithContent('records.csv', $csv);
    }

    /** The standard CSV (the downloadable template) goes straight in, with no mapping. */
    public function testStandardCsvIsImportedWithoutMapping(): void
    {
        $response = $this->post('/api/import', ['file' => $this->standardCsv()]);

        $response->assertStatus(200)->assertJson(['imported' => 3]);

        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'Supermarket purchase',
            'type' => 'expense',
            'amount' => -45.30,
        ]);
        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'Monthly salary',
            'type' => 'income',
            'amount' => 1850.00,
        ]);
    }

    /** A bank export is not imported blind: the column mapping is asked for first. */
    public function testBankCsvAsksForTheColumnMapping(): void
    {
        $response = $this->post('/api/import', ['file' => $this->bankCsv()]);

        $response->assertStatus(409)->assertJson(['needs_mapping' => true]);

        $this->assertEquals(0, Record::where('user_id', $this->user->id)->count());
    }

    /** The inspection shows the header where it is and the rows with their file number. */
    public function testInspectionFindsTheHeaderAndKeepsFileRowNumbers(): void
    {
        $response = $this->post('/api/import/inspect', ['file' => $this->bankCsv()]);

        $response->assertStatus(200)
            ->assertJson([
                'header_row' => 3,
                'standard' => false,
                'columns' => ['Fecha', 'Concepto', 'Importe', 'Saldo'],
            ]);

        $this->assertSame([4, 5, 6, 7, 8, 9], $response->json('preview_row_numbers'));
    }

    /** With the mapping, and the junk rows left out, only movements come in. */
    public function testBankCsvImportsOnlyTheRowsKeptOnScreen(): void
    {
        $response = $this->post('/api/import', [
            'file' => $this->bankCsv(),
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2]),
            'account_id' => $this->account->id,
            'skip_rows' => json_encode([4, 9]),
        ]);

        $response->assertStatus(200)->assertJson(['imported' => 4]);

        foreach (['CARD PURCHASE ACME MART', 'SALARY SEPTEMBER', 'TAX REFUND', 'POWER BILL NORTHWIND'] as $name) {
            $this->assertDatabaseHas('records', ['user_id' => $this->user->id, 'name' => $name]);
        }
        $this->assertDatabaseMissing('records', ['user_id' => $this->user->id, 'name' => 'OPENING BALANCE']);
        $this->assertDatabaseMissing('records', ['user_id' => $this->user->id, 'name' => 'TOTAL']);
    }

    /**
     * Categorising must not get in the way of the duplicate detection: the code
     * is worked out from what the FILE says (or from the default category when it
     * says nothing), never from what the categoriser decides afterwards.
     *
     * This is the real life case: import a statement today, the app learns the
     * merchant, import the same statement tomorrow. It must still be recognised
     * as already there, even though the second time the category comes from what
     * was learned and not from the default.
     */
    public function testTheCategoryTheAppLearnsDoesNotChangeTheCode(): void
    {
        // Una categoria cuelga de una categoria padre: se usa una de las que
        // trae la instalacion (los tests Feature cuentan con la BD sembrada).
        $parent = ParentCategory::first();
        $this->assertNotNull($parent, 'Hace falta la BD sembrada (parent_categories)');

        $category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Groceries',
            'parent_category_id' => $parent->id,
            'icon' => 'fa-solid fa-tag',
            'enabled' => true,
        ]);

        // Una regla propia ("cuando aparezca ACME MART es Groceries"): es lo que
        // hace que la categorizacion automatica mueva el movimiento de sitio.
        $classifier = app(CategoryClassifier::class);

        CategoryRule::create([
            'user_id' => $this->user->id,
            'category_id' => $category->id,
            'match_field' => 'merchant_key',
            'operator' => 'equals',
            'value' => $classifier->merchantKey('CARD PURCHASE ACME MART'),
            'source' => 'manual',
            'enabled' => true,
        ]);

        $payload = [
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2]),
            'account_id' => $this->account->id,
            'skip_rows' => json_encode([4, 9]),
            'auto_categorise' => '1',
        ];

        $first = $this->post('/api/import', $payload + ['file' => $this->bankCsv()]);
        $first->assertStatus(200)->assertJson(['imported' => 4]);

        // The categoriser did move that movement out of the default category...
        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'name' => 'CARD PURCHASE ACME MART',
            'category_id' => $category->id,
        ]);

        // ...and the same file imported again is still seen as already there.
        $second = $this->post('/api/import', $payload + ['file' => $this->bankCsv()]);
        $second->assertStatus(200)->assertJson([
            'imported' => 0,
            'duplicates' => 4,
            'already_there' => true,
        ]);

        $this->assertEquals(4, Record::where('user_id', $this->user->id)->count());
    }

    /**
     * The same export imported twice: every row is already stored, which is not
     * a failure. The screen used to answer "Error to save records, check the
     * file and try again" and the user went looking for a problem that was not
     * there.
     */
    public function testImportingTheSameExportTwiceSaysNothingNew(): void
    {
        $payload = [
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2]),
            'account_id' => $this->account->id,
            'skip_rows' => json_encode([4, 9]),
        ];

        $first = $this->post('/api/import', $payload + ['file' => $this->bankCsv()]);
        $first->assertStatus(200)->assertJson(['imported' => 4, 'duplicates' => 0]);

        $second = $this->post('/api/import', $payload + ['file' => $this->bankCsv()]);
        $second->assertStatus(200)->assertJson([
            'imported' => 0,
            'duplicates' => 4,
            'already_there' => true,
        ]);

        // Nothing stored twice, and an import that brought nothing leaves no row.
        $this->assertEquals(4, Record::where('user_id', $this->user->id)->count());
        $this->assertEquals(1, Import::where('user_id', $this->user->id)->count());
    }

    /**
     * With no type column the SIGN decides: a positive figure is money coming in.
     * Before, every positive row went in as an expense, so a salary was booked
     * as money going out without saying anything.
     */
    public function testTheSignDecidesTheTypeWhenThereIsNoTypeColumn(): void
    {
        $this->post('/api/import', [
            'file' => $this->bankCsv(),
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2]),
            'account_id' => $this->account->id,
            'skip_rows' => json_encode([4, 9]),
        ])->assertStatus(200);

        $this->assertDatabaseHas('records', ['name' => 'SALARY SEPTEMBER', 'type' => 'income', 'amount' => 1850.00]);
        $this->assertDatabaseHas('records', ['name' => 'TAX REFUND', 'type' => 'income', 'amount' => 120.00]);
        $this->assertDatabaseHas('records', ['name' => 'CARD PURCHASE ACME MART', 'type' => 'expense', 'amount' => -45.30]);
        $this->assertDatabaseHas('records', ['name' => 'POWER BILL NORTHWIND', 'type' => 'expense', 'amount' => -78.12]);
    }

    /** A column called "Cargo" is money going out even when the figure has no sign. */
    public function testAColumnNamedCargoIsAlwaysAnExpense(): void
    {
        $csv = "Fecha;Concepto;Cargo\n"
            . "02/09/2026;CARD PURCHASE ACME MART;45,30\n"
            . "03/09/2026;POWER BILL;78,12\n";

        Storage::fake('uploads');
        $file = UploadedFile::fake()->createWithContent('charges.csv', mb_convert_encoding($csv, 'Windows-1252', 'UTF-8'));

        $this->post('/api/import', [
            'file' => $file,
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2]),
            'account_id' => $this->account->id,
        ])->assertStatus(200)->assertJson(['imported' => 2]);

        $this->assertDatabaseHas('records', ['name' => 'CARD PURCHASE ACME MART', 'type' => 'expense', 'amount' => -45.30]);
        $this->assertDatabaseHas('records', ['name' => 'POWER BILL', 'type' => 'expense', 'amount' => -78.12]);
    }

    /** Money coming in with a column of its own (Abono/Haber): always an income. */
    public function testMoneyInColumnIsAlwaysAnIncome(): void
    {
        $csv = "Fecha;Concepto;Cargo;Abono\n"
            . "02/09/2026;CARD PURCHASE ACME MART;45,30;\n"
            . "03/09/2026;SALARY SEPTEMBER;;1.850,00\n";

        Storage::fake('uploads');
        $file = UploadedFile::fake()->createWithContent('charge_credit.csv', mb_convert_encoding($csv, 'Windows-1252', 'UTF-8'));

        $this->post('/api/import', [
            'file' => $file,
            'mapping' => json_encode(['date' => 0, 'name' => 1, 'amount' => 2, 'amount_in' => 3]),
            'account_id' => $this->account->id,
        ])->assertStatus(200)->assertJson(['imported' => 2]);

        $this->assertDatabaseHas('records', ['name' => 'CARD PURCHASE ACME MART', 'type' => 'expense', 'amount' => -45.30]);
        $this->assertDatabaseHas('records', ['name' => 'SALARY SEPTEMBER', 'type' => 'income', 'amount' => 1850.00]);
    }

    /** A file that is not a spreadsheet does not sneak in: only csv, json, xls and xlsx. */
    public function testAnUnsupportedExtensionIsRejected(): void
    {
        Storage::fake('uploads');
        $file = UploadedFile::fake()->createWithContent('statement.txt', "date,name,amount\n2026-09-01,Sample,10\n");

        $this->post('/api/import', ['file' => $file])
            ->assertStatus(422)
            ->assertJsonFragment(['error' => 'That file type cannot be read. Upload a CSV, an Excel file (XLS, XLSX) or a JSON one.']);
    }

    /**
     * A file whose lines all start with the same wording from the bank.
     *
     * Taking that wording as the key makes every shop share one key: a petrol
     * station, a shop and a person end up in the same bucket and the categoriser
     * cannot tell them apart. The key must come from what singles each movement
     * out, and no per-bank list is shipped to do it: the file in front of it is
     * the evidence.
     */
    public function testTheWordingSharedByMostRowsIsNotTheMerchantKey(): void
    {
        $rows = [
            'ZZZ MOBILE EN CORNER SHOP',
            'ZZZ MOBILE EN GAS STATION ONE',
            'ZZZ MOBILE EN CORNER SHOP',
            'ZZZ MOBILE EN MRS SMITH',
            'ZZZ MOBILE EN HARDWARE DEPOT',
            'ZZZ MOBILE EN GAS STATION ONE',
            'ZZZ MOBILE EN MRS SMITH',
            'ZZZ MOBILE EN HARDWARE DEPOT',
            'ZZZ MOBILE EN CORNER SHOP',
        ];

        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";
        $day = 1;
        foreach ($rows as $name) {
            $csv .= sprintf("2026-09-%02d,%d,,expense,,%s,10.00,1\n", $day++, $this->account->id, $name);
        }

        Storage::fake('uploads');

        $response = $this->post('/api/import', [
            'file' => UploadedFile::fake()->createWithContent('statement.csv', $csv),
        ]);

        $response->assertStatus(200)->assertJson(['imported' => 9]);

        $keys = Record::where('user_id', $this->user->id)->pluck('merchant_key', 'name');

        $this->assertSame('CORNER SHOP', $keys['ZZZ MOBILE EN CORNER SHOP']);
        $this->assertSame('GAS STATION', $keys['ZZZ MOBILE EN GAS STATION ONE']);
        $this->assertSame('MRS SMITH', $keys['ZZZ MOBILE EN MRS SMITH']);
        $this->assertSame('HARDWARE DEPOT', $keys['ZZZ MOBILE EN HARDWARE DEPOT']);

        $this->assertFalse($keys->contains('ZZZ MOBILE'), 'The bank wording became the key: ' . json_encode($keys));
        $this->assertSame(4, $keys->unique()->filter()->count(), 'Different shops must not share one key');
    }
}
