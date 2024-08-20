<?php

namespace App\Models;

use App\Models\Category;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Rule extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'name', 'enabled'
    ];

    protected $appends = ['conditions', 'actions', 'explanation'];

    public function getConditionsAttribute()
    {
        return $this->conditions = RuleCondition::where('rule_id', $this->id)->get();
    }

    public function getActionsAttribute()
    {
        return $this->actions = RuleAction::where('rule_id', $this->id)->get();
    }

    public function getExplanationAttribute()
    {
        $condition = $this->conditions->first();
        $action = $this->actions->first();
        return $condition->type_name . ' "' . $condition->condition . '" then ' . $action->type_name . ' "' . $action->action_name . '"';
    }

    public function getCategory() {
        return Category::find($this->actions->first()->action);
    }
}