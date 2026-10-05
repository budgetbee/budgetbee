<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Evidence that a merchant key belongs to a category.
 *
 * A candidate becomes a rule when it has enough confirmations and a clear
 * majority among the evidence for that key. Corrections count as
 * contradictions on the previous candidate, never as destructive changes.
 */
class CategoryCandidate extends Model
{
    protected $fillable = [
        'user_id',
        'merchant_key',
        'category_id',
        'confirmations',
        'contradictions',
        'last_seen_at',
        'ignored_at',
    ];

    protected $casts = [
        'user_id' => 'integer',
        'category_id' => 'integer',
        'confirmations' => 'integer',
        'contradictions' => 'integer',
        'last_seen_at' => 'datetime',
        'ignored_at' => 'datetime',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
