<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Types\Currency;

class CurrencySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(__DIR__ . '/data/currency.json');
        $data = json_decode($json, true);

        
        foreach ($data as $row) {
            $existingCurrency = Currency::where('code', $row['code'])->first();
        
            if (!$existingCurrency) {
                $currency = new Currency();
                $currency->fill([
                    'code' => $row['code'],
                    'symbol' => $row['symbol_native'],
                    'name' => $row['name'],
                    'plural_name' => $row['name_plural']
                ]);
                $currency->save();
            }
        }
        
    }
}
