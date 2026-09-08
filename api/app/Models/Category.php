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
        'id', 'user_id', 'name', 'icon', 'parent_category_id', 'enabled', 'position'
    ];

    protected $casts = [
        'enabled' => 'boolean',
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

    /**
     * IDs of the categories whose parent category is typed $type
     * ('income', 'expense' or 'transfer'). Includes global/shared
     * categories (user_id null) so legacy data keeps working.
     */
    public static function idsByParentType(int $userId, string $type): array
    {
        $parentIds = ParentCategory::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        })
            ->where('type', $type)
            ->pluck('id');

        return self::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        })
            ->whereIn('parent_category_id', $parentIds)
            ->pluck('id')
            ->all();
    }

    /**
     * First usable category of the given parent type for the user
     * (used as a fallback when creating records without a match).
     */
    public static function firstByParentType(int $userId, string $type, ?string $parentNameLike = null): ?Category
    {
        $parentQuery = ParentCategory::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        })
            ->where('type', $type);

        if ($parentNameLike) {
            $parentQuery->where('name', 'like', $parentNameLike);
        }

        $parentIds = $parentQuery->orderBy('position')->orderBy('id')->pluck('id');
        if ($parentIds->isEmpty()) {
            return null;
        }

        return self::where(function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        })
            ->whereIn('parent_category_id', $parentIds)
            ->orderBy('position')
            ->orderBy('id')
            ->first();
    }
}
