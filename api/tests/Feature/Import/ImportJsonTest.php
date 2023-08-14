<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\UserCurrency;
use App\Models\Account;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class ImportJsonTest extends TestCase
{
    private $user;
    private $account1;
    private $account2;
    private $userCurrency1;
    private $userCurrency2;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        $this->actingAs($this->user);

        $this->userCurrency1 = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->userCurrency2 = UserCurrency::factory()->create(['user_id' => $this->user->id]);

        $this->account1 = Account::factory()->create(['user_id' => $this->user->id, 'currency_id' => $this->userCurrency1]);
        $this->account2 = Account::factory()->create(['user_id' => $this->user->id, 'currency_id' => $this->userCurrency2]);
    }

    public function tearDown(): void
    {
        $this->user->delete();
        $this->account1->delete();
        $this->account2->delete();
        $this->userCurrency1->delete();
        $this->userCurrency2->delete();

        parent::tearDown();
    }

    public function testImportSuccess(): void
    {

        $record = Record::factory()->make();
        $record2 = Record::factory()->make();

        $records = [
            [
                'date' => $record->date,
                'from_account_id' => $record->from_account_id,
                'to_account_id' => $record->from_account_id,
                'category_id' => $record->category_id,
                'name' => $record->name,
                'type' => $record->type,
                'amount' => $record->amount,
                'rate' => $record->rate
            ],
            [
                'date' => $record2->date,
                'from_account_id' => $record2->from_account_id,
                'to_account_id' => $record2->from_account_id,
                'category_id' => $record2->category_id,
                'name' => $record2->name,
                'type' => $record2->type,
                'amount' => $record2->amount,
                'rate' => $record2->rate
            ]
        ];

        Storage::fake('uploads'); // Set up a fake disk for testing file uploads

        $file = UploadedFile::fake()->createWithContent('test.json', json_encode($records));

        $data = [
            'file' => $file
        ];

        $response = $this->post('/api/import/json', $data);
        
        $response->assertStatus(200);

        $body = (object) $response->json();

        $this->assertEquals($body->successful, 2);
        $this->assertEquals($body->failed, 0);
        $this->assertEquals($body->already_exists, 0);
        $this->assertCount(2, $body->successful_records);
    }

    public function testImportDataError(): void
    {

        $record = Record::factory()->make();

        $records = [
            [
                'date' => $record->date,
                'from_account_id' => $record->from_account_id,
                'to_account_id' => $record->from_account_id,
                'category_id' => $record->category_id,
                'name' => $record->name,
                'amount' => $record->amount,
                'rate' => $record->rate
            ]
        ];

        Storage::fake('uploads'); // Set up a fake disk for testing file uploads

        $file = UploadedFile::fake()->createWithContent('test.json', json_encode($records));

        $data = [
            'file' => $file
        ];

        $response = $this->post('/api/import/json', $data);
        
        $response->assertStatus(400);
    }
}
