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
        $randomCategory = Category::inRandomOrder()->first()->id;

        $startDate = '-1 year';
        $endDate = 'now';
        $randomDate = $faker->dateTimeBetween($startDate, $endDate)->format('Y-m-d');

        $recordTypes = ['income', 'expense', 'transfer'];
        $recordType = $recordTypes[array_rand($recordTypes)];

        $toAccountId = null;
        
        switch ($recordType) {
            case 'income':
                $randomCategory = 10;
                $amount = $faker->randomFloat(2, 0, 777);
                break;
            case 'expense':
                $amount = $faker->randomFloat(2, -300, 10);
                break;
            case 'transfer':
                $randomCategory = 1;
                $amount = $faker->randomFloat(2, -300, 100);
                $toAccountId = Account::inRandomOrder()->first()->id;
        }

        return [
            'user_id' => $randomUser->id,
            'date' => $randomDate,
            'from_account_id' => $randomAccount->id,
            'to_account_id' => $toAccountId,
            'type' => $recordType,
            'category_id' => $randomCategory,
            'name' => $faker->text(),
            'amount' => $amount
        ];
    }
}
