<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Database\Factories\UserCurrencyFactory;
use App\Models\Types\Currency;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Cache;

class UserCurrency extends Model
{
    use SoftDeletes, HasFactory;
    protected $fillable = [
        'user_id',
        'currency_id',
        'exchange_rate_to_default_currency'
    ];

    protected $appends = ['name', 'code', 'symbol'];

    protected $hidden = ['currency', 'user'];

    protected static function booted()
    {
        static::creating(function ($userCurrency) {
            Cache::clear();
            $user = Auth::user();
            if ($user) {
                $userCurrency->user_id = $user->id;
            }
        });

        static::updating(function () {
            Cache::clear();
        });

        static::addGlobalScope('user_id', function (Builder $builder) {
            $user = Auth::user();
            if ($user) {
                // $builder->where('user_id', Auth::id());
            }
        });
    }

    public static function newFactory(): Factory
    {
        return UserCurrencyFactory::new();
    }

    public function currency()
    {
        return $this->belongsTo(Currency::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getNameAttribute()
    {
        return $this->currency->name;
    }

    public function getCodeAttribute()
    {
        return $this->currency->code;
    }

    public function getSymbolAttribute()
    {
        return $this->currency->symbol;
    }
}
