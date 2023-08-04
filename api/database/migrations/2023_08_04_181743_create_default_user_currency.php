<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\User;
use App\Models\UserCurrency;
use App\Models\Types\Currency;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $users = User::all();

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
