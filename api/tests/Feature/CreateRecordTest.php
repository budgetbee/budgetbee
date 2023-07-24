<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;

class CreateRecordTest extends TestCase
{
    private $user;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();

        parent::tearDown();
    }
    
    /**
     * Create a record Success
     */
    public function testCreateSuccess(): void
    {
        $recordData = Record::factory()->make()->toArray();
        if ($recordData['type'] !== 'transfer') {
            unset($recordData['to_account_id']);
        }
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(200);
    }

    /**
     * Create a record Fail
     */
    public function testCreateInvalidData(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['amount'] = 'test';
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(302);
    }

    /**
     * Create a record Invalid account
     */
    public function testCreateInvalidAccountId(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['from_account_id'] = -1;
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(302);
    }
    
    /**
     * Create a record Invalid to account
     */
    public function testCreateInvalidToAccountId(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['to_account_id'] = -1;
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(302);
    }

    /**
     * Create a record Invalid Category
     */
    public function testCreateInvalidCategoryId(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['category_id'] = -1;
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(302);
    }

    /**
     * Create a transfer record
     */
    public function testCreateTransferSuccess(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['type'] = 'transfer';
        $recordData['to_account_id'] = Account::whereNot('id', $recordData['from_account_id'])->inRandomOrder()->first()->id;
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(200);
        
        $id = json_decode($response->getContent())->id;
        $record = Record::find($id);

        $this->assertIsInt($record->link_record_id);

        $assocRecord = Record::find($record->link_record_id);

        $this->assertIsObject($assocRecord);
        $this->assertEquals($record->id, $assocRecord->link_record_id);
        $this->assertEquals($record->link_record_id, $assocRecord->id);
        $this->assertEquals($record->amount, -$assocRecord->amount);
        $this->assertEquals($record->type, 'transfer');

        $record->delete();
        $assocRecord->delete();
    }

    /**
     * Update a transfer record
     */
    public function testUpdateTransferSuccess(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['type'] = 'transfer';
        $recordData['to_account_id'] = Account::whereNot('id', $recordData['from_account_id'])->inRandomOrder()->first()->id;
        $response = $this->post('/api/record', $recordData);

        $response->assertStatus(200);

        $id = json_decode($response->getContent())->id;
        $record = Record::find($id);
        
        $recordData['type'] = 'expense';
        unset($recordData['to_account_id']);
        $response = $this->post('/api/record/' . $record->id, $recordData);
        
        $response->assertStatus(200);

        $assocRecord = Record::find($record->link_record_id);

        $this->assertNull($assocRecord);

        $record->delete();
    }
}
