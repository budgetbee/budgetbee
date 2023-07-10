<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Rule;
use App\Models\RuleCondition;
use App\Models\RuleAction;
use Exception;

class RuleController extends Controller
{
    public function get(Request $request, $id)
    {
        $rule = Rule::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        return response()->json($rule);
    }

    public function getRules(Request $request)
    {
        $rules = Rule::where('user_id', $request->user()->id)
            ->get();

        return response()->json($rules);
    }

    public function create(Request $request)
    {
        $this->validate($request, [
            'name' => 'required|string',
            'enabled' => 'required|integer',
            'conditions' => 'required|array',
            'actions' => 'required|array'
        ]);

        $data = $request->only('name', 'enabled', 'conditions', 'actions');
        $data['user_id'] = $request->user()->id;

        $rule = new Rule();
        $rule->fill($data);
        $rule->save();


        foreach ($data['conditions'] as $k => $v) {
            $condition = new RuleCondition(
                [
                    'user_id' => $data['user_id'],
                    'rule_id' => $rule->id,
                    'rule_condition_type_id' => $k,
                    'condition' => $v
                ]
            );

            $condition->save();
        }

        foreach ($data['actions'] as $k => $v) {
            $condition = new RuleAction(
                [
                    'user_id' => $data['user_id'],
                    'rule_id' => $rule->id,
                    'rule_action_type_id' => $k,
                    'action' => $v
                ]
            );

            $condition->save();
        }

        return response()->json(['id' => $rule->id]);
    }
}
