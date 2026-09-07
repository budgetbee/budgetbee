<?php

namespace Tests\Feature;

use App\Events\UserCreated;
use App\Models\AiProviderKey;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AiProviderKeyTest extends TestCase
{
    private $user;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        event(new UserCreated($this->user));

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();

        parent::tearDown();
    }

    public function testStoreOpenAiKeyUsesDefaults(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'openai',
            'api_key' => 'sk-test-1234567890',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('ai_provider_keys', [
            'user_id' => $this->user->id,
            'provider' => 'openai',
            'base_url' => null,
            'model' => null,
            'supports_vision' => false,
        ]);

        $key = AiProviderKey::where('user_id', $this->user->id)
            ->where('provider', 'openai')
            ->first();

        // Built-in endpoints/models are resolved dynamically when null.
        $this->assertSame(
            'https://api.openai.com/v1/chat/completions',
            $key->getEndpointUrl()
        );
        $this->assertSame('gpt-4o-mini', $key->getModelName());
        $this->assertTrue($key->supportsVision());
    }

    public function testStoreCustomProviderWithConfig(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
            'base_url' => 'http://localhost:11434/v1',
            'model' => 'gpt-oss:20b',
            'supports_vision' => true,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('ai_provider_keys', [
            'user_id' => $this->user->id,
            'provider' => 'custom',
            'base_url' => 'http://localhost:11434/v1',
            'model' => 'gpt-oss:20b',
            'supports_vision' => true,
        ]);

        $key = AiProviderKey::where('user_id', $this->user->id)
            ->where('provider', 'custom')
            ->first();

        // Base URL without the /chat/completions suffix gets it appended.
        $this->assertSame(
            'http://localhost:11434/v1/chat/completions',
            $key->getEndpointUrl()
        );
        $this->assertSame('gpt-oss:20b', $key->getModelName());
        $this->assertTrue($key->supportsVision());
    }

    public function testStoreCustomAcceptsFullChatCompletionsUrl(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
            'base_url' => 'https://openwebui.example.com/api/chat/completions',
            'model' => 'llama3.1',
        ]);

        $response->assertStatus(200);

        $key = AiProviderKey::where('user_id', $this->user->id)
            ->where('provider', 'custom')
            ->first();

        // Full endpoint URLs are used as-is (no double suffix).
        $this->assertSame(
            'https://openwebui.example.com/api/chat/completions',
            $key->getEndpointUrl()
        );
    }

    public function testStoreCustomRequiresBaseUrlAndModel(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['base_url', 'model']);
    }

    public function testStoreRejectsNonHttpBaseUrl(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
            'base_url' => 'ftp://example.com/v1',
            'model' => 'llama3.1',
        ]);

        $response->assertStatus(302);
        $response->assertSessionHasErrors(['base_url']);
    }

    public function testStoreCustomWithoutVisionDefaultsToFalse(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
            'base_url' => 'http://ollama:11434/v1',
            'model' => 'llama3.1',
        ]);

        $response->assertStatus(200);

        $key = AiProviderKey::where('user_id', $this->user->id)
            ->where('provider', 'custom')
            ->first();

        $this->assertFalse($key->supportsVision());
    }

    public function testIndexReturnsConfiguredFields(): void
    {
        $this->post('/api/ai-provider-keys', [
            'provider' => 'custom',
            'api_key' => 'local-key',
            'base_url' => 'http://localhost:11434/v1',
            'model' => 'gpt-oss:20b',
            'supports_vision' => true,
        ]);

        $response = $this->get('/api/ai-provider-keys');

        $response->assertStatus(200);
        $response->assertJsonFragment([
            'provider' => 'custom',
            'provider_name' => 'Custom (OpenAI-compatible)',
            'base_url' => 'http://localhost:11434/v1',
            'model' => 'gpt-oss:20b',
            'supports_vision' => true,
        ]);
        // The full API key must never be exposed.
        $response->assertJsonMissing(['api_key' => 'local-key']);
    }

    public function testDeepSeekKeepsBuiltInEndpointAndNoVision(): void
    {
        $response = $this->post('/api/ai-provider-keys', [
            'provider' => 'deepseek',
            'api_key' => 'deepseek-key',
        ]);

        $response->assertStatus(200);

        $key = AiProviderKey::where('user_id', $this->user->id)
            ->where('provider', 'deepseek')
            ->first();

        $this->assertSame(
            'https://api.deepseek.com/v1/chat/completions',
            $key->getEndpointUrl()
        );
        $this->assertSame('deepseek-chat', $key->getModelName());
        $this->assertFalse($key->supportsVision());
    }
}
