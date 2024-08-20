<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Types\RuleConditionTypes;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;

class RuleConditionTypesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(__DIR__ . '/data/rule_condition_types.json');
        $data = json_decode($json, true);


        foreach ($data as $ruleConditionTypes) {
            $ruleConditionType = new RuleConditionTypes();
            $ruleConditionType->fill([
                'name' => $ruleConditionTypes['name'],
                'code' => $ruleConditionTypes['code'],
            ]);
            $ruleConditionType->save();
        }
    }
}