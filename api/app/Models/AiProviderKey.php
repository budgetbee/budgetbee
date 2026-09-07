<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Crypt;

class AiProviderKey extends Model
{
    protected $table = 'ai_provider_keys';

    protected $fillable = [
        'user_id',
        'provider',
        'api_key',
        'base_url',
        'model',
        'supports_vision',
    ];

    protected $hidden = [
        'api_key',
    ];

    protected $casts = [
        'supports_vision' => 'boolean',
    ];

    /**
     * The supported AI providers.
     * "custom" is a generic OpenAI-compatible provider (Ollama, Open WebUI, vLLM, ...).
     */
    public const PROVIDERS = [
        'openai',
        'deepseek',
        'custom',
    ];

    /**
     * Display names for providers.
     */
    public const PROVIDER_NAMES = [
        'openai' => 'OpenAI',
        'deepseek' => 'DeepSeek',
        'custom' => 'Custom (OpenAI-compatible)',
    ];

    /**
     * Built-in chat completion endpoints per provider.
     */
    public const DEFAULT_ENDPOINTS = [
        'openai' => 'https://api.openai.com/v1/chat/completions',
        'deepseek' => 'https://api.deepseek.com/v1/chat/completions',
    ];

    /**
     * Built-in default models per provider.
     */
    public const DEFAULT_MODELS = [
        'openai' => 'gpt-4o-mini',
        'deepseek' => 'deepseek-chat',
        'custom' => '',
    ];

    /**
     * Resolve the chat completion endpoint for this provider key.
     *
     * A configured base_url may either be a full endpoint (ending in
     * "/chat/completions") or a base URL — in the latter case the standard
     * suffix is appended, so users can paste either
     * "http://localhost:11434/v1" or "https://host/api/chat/completions".
     */
    public function getEndpointUrl(): string
    {
        if (!empty($this->base_url)) {
            $url = rtrim($this->base_url, '/');
            if (!str_contains($url, '/chat/completions')) {
                $url .= '/chat/completions';
            }
            return $url;
        }

        return self::DEFAULT_ENDPOINTS[$this->provider] ?? '';
    }

    /**
     * Resolve the model name for this provider key, falling back to the
     * provider's built-in default model when none is configured.
     */
    public function getModelName(): string
    {
        if (!empty($this->model)) {
            return $this->model;
        }

        return self::DEFAULT_MODELS[$this->provider] ?? '';
    }

    /**
     * Resolve the display name for this provider key.
     */
    public function getProviderDisplayName(): string
    {
        return self::PROVIDER_NAMES[$this->provider] ?? ucfirst($this->provider ?? 'Unknown');
    }

    /**
     * Whether this provider key can analyse images.
     * OpenAI is vision-capable by default; custom providers must opt in via
     * the supports_vision flag (the configured model decides).
     */
    public function supportsVision(): bool
    {
        if ($this->provider === 'openai') {
            return true;
        }

        return (bool) $this->supports_vision;
    }

    /**
     * Encrypt the API key before storing it in the database.
     */
    public function setApiKeyAttribute($value): void
    {
        $this->attributes['api_key'] = Crypt::encryptString($value);
    }

    /**
     * Decrypt the API key when retrieving it (only when explicitly accessed).
     */
    public function getApiKeyAttribute($value): ?string
    {
        if ($value === null) {
            return null;
        }
        return Crypt::decryptString($value);
    }

    /**
     * Get a masked version of the API key for display purposes.
     * Examples: "sk-...abc123", "sk-****...****xyz"
     */
    public function getMaskedKeyAttribute(): string
    {
        $key = $this->getApiKeyAttribute($this->attributes['api_key'] ?? null);
        if (!$key) {
            return '';
        }

        $length = strlen($key);
        if ($length <= 10) {
            return str_repeat('*', $length);
        }

        $prefix = substr($key, 0, 4);
        $suffix = substr($key, -4);

        return $prefix . str_repeat('*', 8) . $suffix;
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
