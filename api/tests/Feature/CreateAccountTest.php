<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;

class CreateAccountTest extends TestCase
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
     * Create a account Success
     */
    public function testCreateSuccess(): void
    {
        $accountData = Account::factory()->make()->toArray();
        $response = $this->post('/api/account', $accountData);

        $response->assertStatus(200);
    }

    /**
     * Create a account Fail by Data
     */
    public function testCreateInvalidData(): void
    {
        $accountData = Account::factory()->make()->toArray();
        $accountData['initial_balance'] = 'test';
        $response = $this->post('/api/account', $accountData);

        $response->assertStatus(302);
    }
}
