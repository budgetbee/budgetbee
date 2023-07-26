<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class CurrencyConverter
{
    public static function convert(float $amount, string $from, string $to)
    {
        $cacheKey = 'currency_converter_from_' . strtolower($from) . '_to_' . strtolower($to);

        if (Cache::has($cacheKey)) {
            return $amount * Cache::get($cacheKey);
        }

        try {
            $url = "https://www.floatrates.com/daily/" . strtolower($from) . ".json";

            $response = Http::get($url);

            if ($response->successful()) {
                $data = $response->json();
                $rate = (isset($data[strtolower($to)])) ? $data[strtolower($to)]['rate'] : 1;

                Cache::put($cacheKey, $rate, 60);

                return $amount * $rate;
            } else {
                Cache::put($cacheKey, 1, 60);
                return $amount;
            }
        } catch (\Exception $e) {
            return $amount;
        }
    }
}
