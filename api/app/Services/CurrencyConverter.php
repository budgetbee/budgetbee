<?php

namespace App\Services;

use App\Models\UserCurrency;
use App\Models\Record;

class CurrencyConverter
{
    public static function convert(float $amount, UserCurrency $userCurrency)
    {
        if ($userCurrency->currency->code === $userCurrency->user->currency->code) {
            return $amount;
        }
        return $amount / $userCurrency->exchange_rate_to_default_currency;
    }

    public static function convertTransfer(Record $record)
    {
        if ($record->account->currency->code === $record->toAccount->currency->code) {
            return $record->amount;
        }
        return $record->amount * $record->rate;
    }
}
