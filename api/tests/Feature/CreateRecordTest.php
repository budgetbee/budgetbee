<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;

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
}
