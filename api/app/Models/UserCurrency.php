<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use App\Models\Types\Currency;

class UserCurrency extends Model
{
    protected $fillable = [
        'currency_id',
        'exchange_rate_to_default_currency'
    ];

    protected $appends = ['currency_name', 'currency_code', 'currency_symbol'];

    protected $hidden = ['currency'];

    protected static function booted()
    {
        static::creating(function ($userCurrency) {
            $userCurrency->user_id = auth()->user()->id;
        });

        static::addGlobalScope('user_id', function (Builder $builder) {
            $builder->where('user_id', Auth::id());
        });
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function getCurrencyNameAttribute()
    {
        return $this->currency->name;
    }

    public function getCurrencyCodeAttribute()
    {
        return $this->currency->code;
    }

    public function getCurrencySymbolAttribute()
    {
        return $this->currency->symbol;
    }
}
