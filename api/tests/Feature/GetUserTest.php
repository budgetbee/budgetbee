<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;

class GetUserTest extends TestCase
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
    
    public function testGetCurrentUser(): void
    {
        $response = $this->get('/api/user');

        $response->assertStatus(200);
    }

    public function testGetUserById(): void
    {
        $response = $this->get('/api/user/' . $this->user->id);

        $response->assertStatus(200);
    }

    public function testGetAllUsers(): void
    {
        $response = $this->get('/api/user/all');

        $response->assertStatus(200);
    }

    public function testCheckIfUserAdmin(): void
    {
        $response = $this->get('/api/user/isAdmin');

        $response->assertStatus(200);
        $response->assertJson([
            'is_admin' => false
        ]);
    }

    public function testGetUserSettings(): void
    {
        $response = $this->get('/api/user/settings');

        $response->assertStatus(200);
        $this->assertNotEmpty($response->getContent());
    }
}
