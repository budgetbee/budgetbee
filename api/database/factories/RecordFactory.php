<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Account;
use App\Models\Record;
use App\Models\User;
use App\Models\Category;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Record>
 */
class RecordFactory extends Factory
{
    /**
     * The name of the factory's corresponding model.
     *
     * @var string
     */
    protected $model = Record::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $faker = \Faker\Factory::create();

        $randomUser = User::inRandomOrder()->first();
        $randomAccount = Account::inRandomOrder()->first();
        $randomCategory = Category::inRandomOrder()->first();

        $startDate = '-1 year';
        $endDate = 'now';
        $randomDate = $faker->dateTimeBetween($startDate, $endDate)->format('Y-m-d');

        $recordTypes = ['income', 'expense', 'transfer'];

        return [
            'user_id' => $randomUser->id,
            'date' => $randomDate,
            'from_account_id' => $randomAccount->id,
            'type' => $recordTypes[array_rand($recordTypes)],
            'category_id' => $randomCategory->id,
            'name' => $faker->text(),
            'amount' => $faker->randomFloat(2, -3000, 5000)
        ];
    }
}
