<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    protected $seed = true;

    public function testSetupCheckReturnsNotCompletedWhenNoUsers(): void
    {
        // Ensure no users exist
        User::query()->forceDelete();

        $response = $this->get('/api/setup/check');

        $response->assertStatus(200);
        $response->assertJson(['setup_completed' => false]);
    }

    public function testSetupCheckReturnsCompletedWhenUsersExist(): void
    {
        $user = User::factory()->create();

        $response = $this->get('/api/setup/check');

        $response->assertStatus(200);
        $response->assertJson(['setup_completed' => true]);
    }

    public function testSetupRegisterCreatesFirstUser(): void
    {
        // Ensure no users exist
        User::query()->forceDelete();

        $data = [
            'name' => 'First User',
            'email' => 'first@example.com',
            'password' => 'Test1234',
            'confirm_password' => 'Test1234'
        ];

        $response = $this->post('/api/setup/register', $data);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'User created successfully']);

        $this->assertDatabaseHas('users', [
            'name' => 'First User',
            'email' => 'first@example.com'
        ]);
    }

    public function testSetupRegisterFailsWhenUsersExist(): void
    {
        $user = User::factory()->create();

        $data = [
            'name' => 'Another User',
            'email' => 'another@example.com',
            'password' => 'Test1234',
            'confirm_password' => 'Test1234'
        ];

        $response = $this->post('/api/setup/register', $data);

        $response->assertStatus(403);
        $response->assertJson(['message' => 'Setup has already been completed']);
    }

    public function testSetupRegisterFailsWithInvalidData(): void
    {
        // Ensure no users exist
        User::query()->forceDelete();

        $data = [
            'name' => 'Test User',
            'email' => 'invalid-email',
            'password' => 'Test1234',
            'confirm_password' => 'Test1234'
        ];

        $response = $this->post('/api/setup/register', $data);

        $response->assertStatus(302); // Laravel redirects on validation failure
    }

    public function testSetupRegisterFailsWithMismatchedPasswords(): void
    {
        // Ensure no users exist
        User::query()->forceDelete();

        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Test1234',
            'confirm_password' => 'Different'
        ];

        $response = $this->post('/api/setup/register', $data);

        $response->assertStatus(302); // Laravel redirects on validation failure
    }
}
