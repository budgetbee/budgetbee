<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'id', 'name', 'icon', 'parent_category_id'
    ];

    protected $appends = ['color', 'parent_name'];

    protected $hidden = ['parent'];

    public function parent()
    {
        return $this->belongsTo(ParentCategory::class, 'parent_category_id', 'id');
    }

    public function getColorAttribute()
    {
        return $this->parent->color;
    }

    public function getParentNameAttribute()
    {
        return $this->parent->name;
    }
}
