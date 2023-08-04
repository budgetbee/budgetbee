<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Auth;
use App\Models\Types\Currency;
use App\Models\UserCurrency;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\UserCurrency>
 */
class UserCurrencyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = \Faker\Factory::create();

        $user = Auth::user();
        $randomCurrency = Currency::whereNot('code', $user->currency->code)
            ->whereNotIn('code', UserCurrency::where('user_id', $user->id)->get()->pluck('code'))
            ->inRandomOrder()
            ->first();

        return [
            'user_id' => $user->id,
            'currency_id' => $randomCurrency->id,
            'exchange_rate_to_default_currency' => $faker->randomFloat(5, 0, 10)
        ];
    }
}
