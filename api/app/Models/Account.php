<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\Factory;
use Database\Factories\AccountFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Services\CurrencyConverter;
use Illuminate\Support\Facades\Auth;

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
        return $this->belongsTo(Types\Currency::class);
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

    public function getBalanceBaseCurrencyAttribute()
    {
        $user = Auth::user();
        return CurrencyConverter::convert($this->balance, $this->currency_code, $user->currency->code);
    }

    public function getTotalIncomesBaseCurrencyAttribute()
    {
        $user = Auth::user();
        return CurrencyConverter::convert($this->total_incomes, $this->currency_code, $user->currency->code);
    }

    public function getTotalExpensesBaseCurrencyAttribute()
    {
        $user = Auth::user();
        return CurrencyConverter::convert($this->total_expenses, $this->currency_code, $user->currency->code);
    }

    public function getInitialBalanceBaseCurrencyAttribute()
    {
        $user = Auth::user();
        return CurrencyConverter::convert($this->initial_balance, $this->currency_code, $user->currency->code);
    }
}
