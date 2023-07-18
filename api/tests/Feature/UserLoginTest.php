<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;

class UserLoginTest extends TestCase
{
    public function testLogin(): void
    {
        $userPass = 'UserTest123';
        $user = User::factory()->create(['password' => $userPass]);

        $data = ['email' => $user->email, 'password' => $userPass];

        $response = $this->post('/api/login', $data);

        $response->assertStatus(200);

        $user->delete();
    }

    public function testLogout(): void
    {
        $user = User::factory()->create(['password' => 'UserTest123']);

        $data = ['email' => $user->email, 'password' => 'UserTest123'];
        $response = $this->post('/api/login', $data);
        $response->assertStatus(200);

        $response = $this->post('/api/user/logout');
        $response->assertStatus(200);

        $user->delete();
    }
}
