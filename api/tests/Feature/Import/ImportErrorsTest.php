<?php

namespace Tests\Feature\Import;

use App\Models\Account;
use App\Models\Record;
use App\Models\User;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * What the user reads when an import goes wrong.
 *
 * The point of this file: no failure of the importer may end up on screen as
 * "Unknown error" or as a raw 500. Every one of them answers with a sentence
 * saying what happened and what to do next, and with the right status.
 *
 * The files are made up: the shapes are what matter (empty, header only, not a
 * spreadsheet at all), not anybody's movements.
 */
class ImportErrorsTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);
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

    private function upload(string $content, string $name): UploadedFile
    {
        Storage::fake('uploads');

        return UploadedFile::fake()->createWithContent($name, $content);
    }

    private function standard(): UploadedFile
    {
        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";

        return $this->upload($csv, 'records.csv');
    }

    private function bankCsv(): UploadedFile
    {
        $csv = "Cuenta;ES00 0000 0000 0000 0000 0000\n"
            . "Fecha;Concepto;Importe;Saldo\n"
            . "02/09/2026;CARD PURCHASE ACME MART;-45,30;2.454,70\n"
            . "03/09/2026;SALARY SEPTEMBER;1.850,00;4.304,70\n";

        return $this->upload($csv, 'statement.csv');
    }

    /** The message the user reads is the point, so it is checked, not only the status. */
    private function assertSays(string $fragment, $response): void
    {
        $response->assertStatus(422);
        $this->assertStringContainsString($fragment, (string) $response->json('error'));
    }

    /**
     * A file with nothing in it at all: not a mapping problem, so the user is
     * told what is wrong instead of being sent to choose columns that are not
     * in the file.
     */
    public function test_an_empty_file_is_explained(): void
    {
        $response = $this->post('/api/import', ['file' => $this->upload('', 'empty.csv')]);

        $response->assertStatus(400);
        $this->assertStringContainsString('no rows we can read', (string) $response->json('error'));
    }

    /** The template with no movements under the header: nothing to import, said plainly. */
    public function test_a_file_with_only_the_header_is_explained(): void
    {
        $response = $this->post('/api/import', ['file' => $this->standard()]);

        $response->assertStatus(400);
        $this->assertStringContainsString('No movement could be read', (string) $response->json('error'));
    }

    /** A mapping that does not fit the file: no row can be read with it. */
    public function test_a_mapping_that_fits_nothing_is_explained(): void
    {
        $response = $this->post('/api/import', [
            'file' => $this->bankCsv(),
            'mapping' => json_encode(['date' => 3, 'name' => 0, 'amount' => 3]),
            'account_id' => $this->account->id,
        ]);

        $response->assertStatus(400);
        $this->assertStringContainsString('No movement could be read', (string) $response->json('error'));
        $this->assertEquals(0, Record::where('user_id', $this->user->id)->count());
    }

    /**
     * A .xlsx that is not a spreadsheet: the reader blows up inside, and what the
     * user gets is a sentence, not the exception.
     */
    public function test_a_broken_spreadsheet_is_explained(): void
    {
        $response = $this->post('/api/import', [
            'file' => $this->upload('this is not a spreadsheet at all', 'broken.xlsx'),
        ]);

        $response->assertStatus(400);
        $this->assertStringContainsString('No movement could be read', (string) $response->json('error'));
        // Never the raw exception, and never an empty body.
        $this->assertStringNotContainsString('ZipArchive', (string) $response->json('error'));
        $this->assertStringNotContainsString('Exception', (string) $response->json('error'));
    }

    /** A type the importer does not read. */
    public function test_an_unsupported_type_is_explained(): void
    {
        $response = $this->post('/api/import', ['file' => $this->upload('hello', 'notes.txt')]);

        $this->assertSays('file type', $response);
    }

    /** No file in the request at all (what an empty POST looks like). */
    public function test_no_file_at_all_is_explained(): void
    {
        $response = $this->post('/api/import', []);

        $this->assertSays('No file arrived', $response);
    }

    /** A file over the 10MB the importer takes. */
    public function test_a_file_over_the_limit_is_explained(): void
    {
        Storage::fake('uploads');

        $response = $this->post('/api/import', [
            'file' => UploadedFile::fake()->create('huge.csv', 11000, 'text/csv'),
        ]);

        $this->assertSays('bigger than the 10 MB', $response);
    }

    /** The inspection screen answers the same way, it is the same file check. */
    public function test_the_inspection_explains_a_bad_file_too(): void
    {
        $response = $this->post('/api/import/inspect', ['file' => $this->upload('hello', 'notes.txt')]);

        $this->assertSays('file type', $response);
    }

    /** And a request to an API route that does not exist still answers in words. */
    public function test_an_unknown_api_route_answers_in_words(): void
    {
        $response = $this->getJson('/api/this-does-not-exist');

        $response->assertStatus(404);
        $this->assertNotEmpty($response->json('error'));
    }
}
