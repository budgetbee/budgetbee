<?php

namespace App\Models;

use App\Models\Category;
use App\Models\Types\RuleActionTypes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

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

    protected $appends = ['type_name', 'action_name'];

    public function type()
    {
        return $this->belongsTo(RuleActionTypes::class, 'rule_action_type_id');
    }

    public function getTypeNameAttribute()
    {
        return $this->type->name;
    }

    public function getActionNameAttribute()
    {
        $text = '';
        switch ($this->type->code) {
            case 'ADD_CATEGORY':
                $category = Category::find($this->action);
                $text = $category->name . ' (' . $category->parent_name . ')';
                break;
        }
        return $text;
    }
}