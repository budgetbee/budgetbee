<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

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

    protected $appends = ['conditions', 'actions'];

    public function getConditionsAttribute()
    {
        return $this->conditions = RuleCondition::where('rule_id', $this->id)->get();
    }

    public function getActionsAttribute()
    {
        return $this->actions = RuleAction::where('rule_id', $this->id)->get();
    }
}
