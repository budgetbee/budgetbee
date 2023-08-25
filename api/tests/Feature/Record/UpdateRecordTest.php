<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;
use App\Models\UserCurrency;

class UpdateRecordTest extends TestCase
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
    
    /**
     * Update a transfer record
     */
    public function testUpdateTransferSuccess(): void
    {
        $recordData = Record::factory()->make()->toArray();
        $recordData['type'] = 'transfer';
        $recordData['to_account_id'] = Account::whereNot('id', $recordData['from_account_id'])->inRandomOrder()->first()->id;
        $recordData['rate'] = 1.2;

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
