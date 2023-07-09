<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\RuleActionTypes;

class RuleActionTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(__DIR__ . '/data/rule_action_types.json');
        $data = json_decode($json, true);

        
        foreach ($data as $ruleActionTypes) {
            $ruleActionType = new RuleActionTypes();
            $ruleActionType->fill([
                'name' => $ruleActionTypes['name'],
                'code' => $ruleActionTypes['code'],
            ]);
            $ruleActionType->save();
        }
    }
}
