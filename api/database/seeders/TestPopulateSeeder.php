<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Record;
use Illuminate\Database\Seeder;

class TestPopulateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */

    public function run(): void
    {
        Account::factory()
            ->count(7)
            ->create();

        Record::factory()
            ->count(1000)
            ->create();
    }
}
