<?php

namespace App\Services;

use App\Models\UserCurrency;

class CurrencyConverter
{
    public static function convert(float $amount, UserCurrency $from)
    {
        if ($from->currency->code === $from->user->currency->code) {
            return $amount;
        }
        return $amount / $from->exchange_rate_to_default_currency;
    }
}
