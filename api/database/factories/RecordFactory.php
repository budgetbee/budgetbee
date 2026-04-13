<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use App\Models\Account;
use App\Models\Record;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

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

        $user = Auth::user();
        if (is_null($user)) {
            $user = User::inRandomOrder()->first();
        }
        $randomAccount = Account::where('user_id', $user->id)->first();

        // Use only categories that belong to this user's own parent categories
        $userParentIds = \App\Models\ParentCategory::where('user_id', $user->id)->pluck('id');
        $randomCategory = Category::whereIn('parent_category_id', $userParentIds)->inRandomOrder()->first()->id;

        $startDate = '-1 year';
        $endDate = 'now';
        $randomDate = $faker->dateTimeBetween($startDate, $endDate)->format('Y-m-d');

        $recordTypes = ['income', 'expense', 'transfer'];
        $recordType = $recordTypes[array_rand($recordTypes)];

        $toAccountId = null;
        $rate = null;

        // Get this user's "Incomes" parent category ID to use for income records
        $userIncomeParent = \App\Models\ParentCategory::where('user_id', $user->id)->where('name', 'Incomes')->first();
        $userTransferCategory = Category::whereIn('parent_category_id', $userParentIds)->where('name', 'Transfer')->first();

        switch ($recordType) {
            case 'income':
                $incomeParentId = $userIncomeParent ? $userIncomeParent->id : $userParentIds->first();
                $randomCategory = Category::where('parent_category_id', $incomeParentId)->inRandomOrder()->first()->id;
                $amount = $faker->randomFloat(2, 0, 777);
                break;
            case 'expense':
                $amount = $faker->randomFloat(2, -300, 10);
                break;
            case 'transfer':
                $randomCategory = $userTransferCategory ? $userTransferCategory->id : $randomCategory;
                $amount = $faker->randomFloat(2, -300, 100);
                $toAccountId = Account::where('user_id', $user->id)->inRandomOrder()->first()->id;
                $rate = $faker->randomFloat(2, -1, 2);
                if ($rate === 0) {
                    $rate = 1;
                }
        }

        return [
            'user_id' => $user->id,
            'date' => $randomDate,
            'from_account_id' => $randomAccount->id,
            'to_account_id' => $toAccountId,
            'type' => $recordType,
            'category_id' => $randomCategory,
            'name' => $faker->text(),
            'amount' => $amount,
            'rate' => $rate
        ];
    }
}
