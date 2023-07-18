<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class UpdateUserTest extends TestCase
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
    
    public function testUpdateUserSuccess(): void
    {
        $user = ['name' => 'NameTest', 'email' => time() . 'test@test.com'];
        $response = $this->post('/api/user/' . $this->user->id, $user);

        $response->assertStatus(200);
    }

    public function testUpdateUserSuccessWithPassword(): void
    {
        $user = $this->user->toArray();
        $user['password'] = 'Test1234';
        $user['confirm_password'] = 'Test1234';
        $response = $this->post('/api/user/' . $user['id'], $user);

        $response->assertStatus(200);
    }

    public function testUpdateUserConfirmPasswordFail(): void
    {
        $user = $this->user->toArray();
        $user['password'] = 'Test1234';
        $user['confirm_password'] = '1234';
        $response = $this->post('/api/user/' . $user['id'], $user);

        $response->assertStatus(302);
    }

    public function testUpdateAnotherUserFail(): void
    {
        $user2 = User::whereNot('id', $this->user->id)->first();
        $user = ['name' => 'NameTest', 'email' => time() . 'test@test.com'];
        $response = $this->post('/api/user/' . $user2->id, $user);

        $response->assertStatus(403);
    }
}
