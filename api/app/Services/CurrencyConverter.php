<?php

namespace App\Services;

use App\Models\UserCurrency;
use App\Models\Record;

class CurrencyConverter
{
    public static function convert(float $amount, UserCurrency $from)
    {
        if ($from->currency->code === $from->user->currency->code) {
            return $amount;
        }
        return $amount / $from->exchange_rate_to_default_currency;
    }

    public static function convertTransfer(Record $record)
    {
        if ($record->account->currency->code === $record->toAccount->currency->code) {
            return $record->amount;
        }
        return $record->amount * $record->rate;
    }
}
