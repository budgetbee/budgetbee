<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RuleAction extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'rule_id', 'rule_action_type_id', 'action'
    ];

    protected $hidden = ['type'];

    protected $appends = ['type_name'];

    public function type()
    {
        return $this->belongsTo(RuleActionTypes::class, 'rule_action_type_id');
    }

    public function getTypeNameAttribute()
    {
        return $this->type->name;
    }
}
