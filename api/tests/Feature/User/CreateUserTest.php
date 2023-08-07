<?php

namespace Tests\Feature\User;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class CreateUserTest extends TestCase
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
    
    public function testCreateUserSuccess(): void
    {
        $user = User::factory()->make()->toArray();
        $user['password'] = 'Test1234';
        $user['confirm_password'] = 'Test1234';
        $response = $this->post('/api/user/register', $user);

        $response->assertStatus(200);
    }

    public function testCreateUserFailPasswordConfirm(): void
    {
        $user = User::factory()->make()->toArray();
        $user['password'] = 'Test1234';
        $user['confirm_password'] = '1234';
        $response = $this->post('/api/user/register', $user);

        $response->assertStatus(302);
    }

}
