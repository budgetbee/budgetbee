<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\SoftDeletes;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'currency_id'
    ];

    protected $appends = ['currency_symbol'];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'remember_token',
        'currency'
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
    ];

    public function currency()
    {
        return $this->belongsTo(Types\Currency::class);
    }

    public function getCurrencySymbolAttribute()
    {
        return $this->currency ? $this->currency->symbol : '';
    }

    public function getSettings()
    {
        return [
            'currency' => [
                'id' => $this->currency ? $this->currency->id : '',
                'symbol' => $this->currency_symbol
            ]
        ];
    }
}
