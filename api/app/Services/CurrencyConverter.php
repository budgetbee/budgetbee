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

    public static function convertToUserCurrency(Record $record): float {
        $recordCurrency = $record->account->currency;
        $userCurrency = Auth::user()->currency;

        if ($recordCurrency->code !== $userCurrency->code) {
            return $record->amount / $recordCurrency->exchange_rate_to_default_currency;
        }

        return $record->amount;
    }

    public static function convertTransfer(Record $record)
    {
        if ($record->account->currency->code === $record->toAccount->currency->code) {
            return $record->amount;
        }
        return $record->amount * $record->rate;
    }
}
