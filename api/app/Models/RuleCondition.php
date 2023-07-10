<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RuleCondition extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'rule_id', 'rule_condition_type_id', 'condition'
    ];

    protected $hidden = ['type'];

    protected $appends = ['type_name'];

    public function type()
    {
        return $this->belongsTo(RuleConditionTypes::class, 'rule_condition_type_id');
    }

    public function getTypeNameAttribute()
    {
        return $this->type->name;
    }
}
