<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\Factory;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Services\CurrencyConverter;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;

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
        'user_id', 'name', 'type_id', 'color', 'initial_balance', 'current_balance', 'currency_id'
    ];

    protected $appends = ['type_name', 'balance', 'balance_base_currency', 'total_incomes', 'total_incomes_base_currency', 'total_expenses', 'total_expenses_base_currency', 'currency_symbol', 'currency_name', 'currency_code', 'initial_balance_base_currency'];

    protected $hidden = ['type', 'currency'];

    public static function boot()
    {
        parent::boot();

        static::creating(function () {
            Cache::clear();
        });

        static::updating(function () {
            Cache::clear();
        });

        static::deleting(function () {
            Cache::clear();
        });
    }

    protected static function newFactory(): Factory
    {
        return AccountFactory::new();
    }

    public function type()
    {
        return $this->belongsTo(AccountTypes::class);
    }

    public function currency()
    {
        return $this->belongsTo(UserCurrency::class, 'currency_id', 'id');
    }

    public function getTypeNameAttribute()
    {
        return $this->type->name;
    }

    public function getCurrencySymbolAttribute()
    {
        return $this->currency ? $this->currency->symbol : '';
    }

    public function getCurrencyNameAttribute()
    {
        return $this->currency ? $this->currency->name : '';
    }

    public function getCurrencyCodeAttribute()
    {
        return $this->currency ? $this->currency->code : '';
    }

    public function getBalanceAttribute()
    {

        $initialBalance = $this->initial_balance;
        return Record::where('from_account_id', $this->id)
            ->orderBy('date')
            ->pluck('amount')
            ->reduce(function ($balance, $amount) {
                return round($balance + $amount, 2);
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

    public function getBalanceBaseCurrencyAttribute()
    {
        return CurrencyConverter::convert($this->balance, $this->currency);
    }

    public function getTotalIncomesBaseCurrencyAttribute()
    {
        return CurrencyConverter::convert($this->total_incomes, $this->currency);
    }

    public function getTotalExpensesBaseCurrencyAttribute()
    {
        return CurrencyConverter::convert($this->total_expenses, $this->currency);
    }

    public function getInitialBalanceBaseCurrencyAttribute()
    {
        return CurrencyConverter::convert($this->initial_balance, $this->currency);
    }
}
