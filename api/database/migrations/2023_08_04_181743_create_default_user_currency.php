<?php

use App\Models\User;
use App\Models\UserCurrency;
use App\Models\Types\Currency;
use Database\Seeders\CurrencySeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $users = User::all();

        (new DatabaseSeeder())->call(CurrencySeeder::class);

        sleep(5);

        foreach ($users as $user) {
            $currency = $user->currency;
            if (is_null($currency)) {
                $userCurrency = UserCurrency::where('user_id', $user->id)->first();
                if (is_null($userCurrency)) {
                    $userCurrency = UserCurrency::create([
                        'user_id' => $user->id,
                        'currency_id' => Currency::where('code', 'USD')->first()->id,
                        'exchange_rate_to_default_currency' => 1
                    ]);
                }
                $user->fill(['currency_id' => $userCurrency->id])
                    ->save();
            }
        }
    }
};
