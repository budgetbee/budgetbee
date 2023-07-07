<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Account;
use App\Models\User;
use App\Models\AccountTypes;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Account>
 */
class AccountFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Account::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = \Faker\Factory::create();

        $randomUser = User::inRandomOrder()->first();
        $randomType = AccountTypes::inRandomOrder()->first();

        return [
            'user_id' => $randomUser->id,
            'name' => $faker->creditCardType(),
            'type_id' => $randomType->id,
            'color' => $faker->hexcolor(),
            'initial_balance' => $faker->randomFloat(2, -1000, 500000)
        ];
    }
}
