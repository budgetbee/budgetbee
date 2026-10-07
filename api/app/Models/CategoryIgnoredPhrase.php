<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * A wording the user said is not a merchant ("card payment" and the like).
 *
 * It is stored normalised (uppercase, no accents, single spaces) and is taken
 * out of the text before the merchant key is worked out.
 */
class CategoryIgnoredPhrase extends Model
{
    protected $fillable = ['user_id', 'phrase'];

    protected $casts = [
        'user_id' => 'integer',
    ];

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }
}
