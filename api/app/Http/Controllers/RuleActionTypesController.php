<?php

namespace App\Http\Controllers;

use App\Models\Types\RuleActionTypes;

class RuleActionTypesController extends Controller
{
    public function list()
    {
        $rule_actions = RuleActionTypes::all();

        return response()->json($rule_actions);
    }
}