<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\DB;

class Account extends Model
{
    use SoftDeletes;
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'name', 'type_id', 'color', 'initial_balance', 'current_balance'
    ];

    protected $appends = ['type_name', 'balance'];

    protected $hidden = ['type'];

    public function type()
    {
        return $this->belongsTo(AccountTypes::class);
    }

    public function getTypeNameAttribute()
    {
        return $this->type->name;
    }

    public function getBalanceAttribute()
    {

        $initialBalance = $this->initial_balance;
        return Record::where('from_account_id', $this->id)
            ->orderBy('date')
            ->pluck('amount')
            ->reduce(function ($balance, $amount) {
                return $balance + $amount;
            }, $initialBalance);
    }
}
