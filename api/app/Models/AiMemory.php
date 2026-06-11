<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiMemory extends Model
{
    protected $table = 'ai_memories';

    protected $fillable = [
        'user_id',
        'key',
        'value',
    ];

    /**
     * Get all memories for a user as a formatted string for the system prompt.
     */
    public static function getContextForUser(int $userId): string
    {
        $memories = self::where('user_id', $userId)
            ->orderBy('updated_at', 'desc')
            ->get();

        if ($memories->isEmpty()) {
            return '';
        }

        $lines = [];
        foreach ($memories as $m) {
            // Sanitize to prevent prompt injection via memory values
            $safeKey = str_replace(['`', '<', '>', '[', ']', '(', ')', '*', '_', '|'], '', $m->key);
            $safeValue = str_replace(['`', '<', '>', '[', ']', '(', ')', '*', '_', '|'], '', $m->value);
            $safeKey = mb_substr(trim($safeKey), 0, 100);
            $safeValue = mb_substr(trim($safeValue), 0, 300);
            $lines[] = "- **{$safeKey}**: {$safeValue}";
        }

        return implode("\n", $lines);
    }

    /**
     * Upsert a memory key-value pair for a user.
     */
    public static function upsertForUser(int $userId, string $key, string $value): void
    {
        self::updateOrCreate(
            ['user_id' => $userId, 'key' => $key],
            ['value' => $value]
        );
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
