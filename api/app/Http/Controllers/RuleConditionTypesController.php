<?php

namespace App\Http\Controllers;

use App\Models\Types\RuleConditionTypes;

class RuleConditionTypesController extends Controller
{
    public function list()
    {
        $rule_conditions = RuleConditionTypes::all();

        return response()->json($rule_conditions);
    }
}