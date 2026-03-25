<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ApiKey;

class ApiKeyTest extends TestCase
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
        ApiKey::where('user_id', $this->user->id)->delete();
        $this->user->delete();

        parent::tearDown();
    }

    public function testCreateApiKey(): void
    {
        $response = $this->post('/api/api-keys', ['name' => 'Test Key']);

        $response->assertStatus(200);
        $response->assertJsonStructure(['id', 'name', 'key', 'created_at']);

        $data = $response->json();
        $this->assertEquals('Test Key', $data['name']);
        $this->assertNotEmpty($data['key']);
    }

    public function testCreateApiKeyRequiresName(): void
    {
        $response = $this->postJson('/api/api-keys', []);

        $response->assertStatus(422);
    }

    public function testListApiKeys(): void
    {
        $this->post('/api/api-keys', ['name' => 'Key 1']);
        $this->post('/api/api-keys', ['name' => 'Key 2']);

        $response = $this->get('/api/api-keys');

        $response->assertStatus(200);
        $this->assertCount(2, $response->json());
    }

    public function testDeleteApiKey(): void
    {
        $createResponse = $this->post('/api/api-keys', ['name' => 'To Delete']);
        $keyId = $createResponse->json()['id'];

        $response = $this->delete('/api/api-keys/' . $keyId);

        $response->assertStatus(200);

        $this->assertNull(ApiKey::find($keyId));
    }

    public function testDeleteNonExistentApiKey(): void
    {
        $response = $this->deleteJson('/api/api-keys/99999');

        $response->assertStatus(404);
    }

    public function testApiKeyIsHashedInDatabase(): void
    {
        $response = $this->post('/api/api-keys', ['name' => 'Hash Test']);

        $plainTextKey = $response->json()['key'];
        $apiKey = ApiKey::where('user_id', $this->user->id)->first();

        $this->assertNotEquals($plainTextKey, $apiKey->key);
        $this->assertEquals(hash('sha256', $plainTextKey), $apiKey->key);
    }

    public function testCannotDeleteOtherUsersApiKey(): void
    {
        $otherUser = User::factory()->create(['password' => 'UserTest123']);
        $apiKey = ApiKey::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Key',
            'key' => hash('sha256', 'test-key'),
        ]);

        $response = $this->deleteJson('/api/api-keys/' . $apiKey->id);

        $response->assertStatus(404);

        $apiKey->delete();
        $otherUser->delete();
    }
}
