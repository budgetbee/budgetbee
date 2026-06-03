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
    ];

    protected $hidden = [
        'api_key',
    ];

    /**
     * The supported AI providers.
     */
    public const PROVIDERS = [
        'openai',
        'deepseek',
    ];

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
