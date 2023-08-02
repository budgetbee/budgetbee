<?php

namespace App\Services;

use App\Models\UserCurrency;

class CurrencyConverter
{
    public static function convert(float $amount, UserCurrency $from)
    {
        return $from->exchange_rate_to_default_currency * $amount;
    }
}
