<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class UserLoginTest extends TestCase
{
    /**
     * A basic feature test example.
     */
    public function testLogin(): void
    {
        $userPass = 'UserTest123';
        $user = User::factory()->create(['password' => $userPass]);

        $data = ['email' => $user->email, 'password' => $userPass];

        $response = $this->post('/api/login', $data);

        $response->assertStatus(200);

        $user->delete();
    }
}
