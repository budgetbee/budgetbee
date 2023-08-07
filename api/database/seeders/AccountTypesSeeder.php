<?php

namespace Database\Seeders;

use App\Models\AccountTypes;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AccountTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(__DIR__ . '/data/account_types.json');
        $data = json_decode($json, true);


        foreach ($data as $accountType) {
            $existingType = AccountTypes::where('name', $accountType['name'])->first();

            if (!$existingType) {
                $newAccountType = new AccountTypes();
                $newAccountType->fill([
                    'name' => $accountType['name']
                ]);
                $newAccountType->save();
            }
        }
    }
}
