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
            // 'enabled' => 'required|integer',
            'condition_id' => 'required|integer|exists:App\Models\Types\RuleConditionTypes,id',
            'condition' => 'required',
            'action_id' => 'required|integer|exists:App\Models\Types\RuleActionTypes,id',
            'action' => 'required',
        ]);

        $user = $request->user();

        $rule = new Rule();
        $rule->fill([
            'name' => 'Test',
            'enabled' => true,
            'user_id' => $user->id
        ]);
        $rule->save();

        $condition = new RuleCondition(
            [
                'user_id' => $user->id,
                'rule_id' => $rule->id,
                'rule_condition_type_id' => $request->get('condition_id'),
                'condition' => $request->get('condition'),
            ]
        );
        $condition->save();

        $condition = new RuleAction(
            [
                'user_id' => $user->id,
                'rule_id' => $rule->id,
                'rule_action_type_id' => $request->get('action_id'),
                'action' => $request->get('action'),
            ]
        );
        $condition->save();

        return response()->json(['id' => $rule->id]);
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            // 'enabled' => 'required|integer',
            'condition_id' => 'required|integer|exists:App\Models\Types\RuleConditionTypes,id',
            'condition' => 'required',
            'action_id' => 'required|integer|exists:App\Models\Types\RuleActionTypes,id',
            'action' => 'required',
        ]);

        $rule = Rule::find($id);

        $condition = RuleCondition::where('rule_id', $rule->id)->first();
        $action = RuleAction::where('rule_id', $rule->id)->first();

        $condition->fill(
            [
                'rule_condition_type_id' => $request->get('condition_id'),
                'condition' => $request->get('condition'),
            ]
        )->save();

        $action->fill(
            [
                'rule_action_type_id' => $request->get('action_id'),
                'action' => $request->get('action'),
            ]
        )->save();

        return response()->json(['id' => $rule->id]);
    }

    public function delete($id)
    {
        Rule::find($id)->delete();

        return response()->json();
    }

    public function checkRules(string $text)
    {
        $rules = Rule::all();

        foreach ($rules as $rule) {
            $condition = $rule->conditions->first();

            $condition_code = $condition->type->code;
            $condition_text = strtolower($condition->condition);
            $text = strtolower($text);
            
            if ($condition_code == 'WHEN_TEXT_CONTAINS') {
                if (strpos($text, $condition_text) !== false) {
                    return $rule;
                }
            } else if ($condition_code == 'WHEN_TEXT_STARTS_WITH') {
                if (strpos($text, $condition_text) === 0) {
                    return $rule;
                }
            } else if ($condition_code == 'WHEN_TEXT_ENDS_FOR') {
                if (substr($text, -strlen($condition_text)) === $condition_text) {
                    return $rule;
                }
            }
        }
        
        return null;
    }
}
