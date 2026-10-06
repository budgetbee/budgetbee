<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * The column mapping a user confirmed for one file shape, so the next file from
 * the same bank comes up already mapped.
 */
class ImportColumnMapping extends Model
{
    protected $fillable = [
        'user_id',
        'signature',
        'file_format',
        'mapping',
        'skip_rows',
        'account_id',
    ];

    protected $casts = [
        'mapping' => 'array',
        'skip_rows' => 'array',
    ];
}
