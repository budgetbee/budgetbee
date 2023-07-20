<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\Factory;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Account extends Model
{
    use SoftDeletes;
    use HasFactory;
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'name', 'type_id', 'color', 'initial_balance', 'current_balance'
    ];

    protected $appends = ['type_name', 'balance', 'total_incomes', 'total_expenses'];

    protected $hidden = ['type'];

    protected static function newFactory(): Factory
    {
        return AccountFactory::new();
    }


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

    public function getTotalIncomesAttribute()
    {

        $initialBalance = $this->initial_balance;
        return Record::where('from_account_id', $this->id)
            ->where('type', 'income')
            ->orderBy('date')
            ->pluck('amount')
            ->reduce(function ($balance, $amount) {
                return $balance + $amount;
            }, $initialBalance);
    }

    public function getTotalExpensesAttribute()
    {

        $initialBalance = $this->initial_balance;
        return Record::where('from_account_id', $this->id)
            ->where('type', 'expense')
            ->orderBy('date')
            ->pluck('amount')
            ->reduce(function ($balance, $amount) {
                return $balance + $amount;
            }, $initialBalance);
    }
}
