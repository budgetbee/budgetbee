<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A categorisation rule: "this merchant key belongs to this category".
 *
 * source = manual  -> created by the user (always wins)
 * source = learned -> promoted automatically after repeated confirmations
 * source = ai      -> never auto-promoted; reserved for the AI phase
 */
class CategoryRule extends Model
{
    public const SOURCE_MANUAL = 'manual';
    public const SOURCE_LEARNED = 'learned';
    public const SOURCE_AI = 'ai';

    public const OPERATORS = ['equals', 'starts_with', 'contains', 'regex'];
    public const FIELDS = ['merchant_key', 'text'];

    protected $fillable = [
        'user_id',
        'match_field',
        'operator',
        'value',
        'category_id',
        'priority',
        'source',
        'hits',
        'last_hit_at',
        'enabled',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'category_id' => 'integer',
        'priority' => 'integer',
        'hits' => 'integer',
        'enabled' => 'boolean',
        'last_hit_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', true);
    }
}
