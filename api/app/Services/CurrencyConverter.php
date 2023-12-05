<?php

namespace App\Services;

use App\Models\Record;
use Illuminate\Support\Facades\Auth;

class CurrencyConverter
{
    public static function convert(float $amount, $accoutCurrency)
    {
        $accountCurrencyCode = $accoutCurrency->currency->code;
        $userCurrencyCode = Auth::user()->currency->code;

        if (is_null($accoutCurrency) || $accountCurrencyCode === $userCurrencyCode) {
            return $amount;
        }
        return $amount / $accoutCurrency->exchange_rate_to_default_currency;
    }

    public static function convertTransfer(Record $record)
    {
        if ($record->account->currency->code === $record->toAccount->currency->code) {
            return $record->amount;
        }
        return $record->amount * $record->rate;
    }
}
