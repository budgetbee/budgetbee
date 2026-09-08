<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParentCategory extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'id', 'user_id', 'name', 'color', 'icon', 'enabled', 'position'
    ];

    protected $casts = [
        'enabled' => 'boolean',
    ];

    public function categories()
    {
        return $this->hasMany(Category::class, 'parent_category_id', 'id');
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('position')->orderBy('id');
    }

}
