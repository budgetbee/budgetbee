<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class UpcomingExpense extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['user_id', 'title', 'category_id', 'amount', 'due_date'];

    protected $appends = [
        'parent_category_id',
        'parent_category_name',
        'category_name',
        'category_icon',
        'category_color',
        'months_remaining',
        'monthly_amount',
    ];

    protected $hidden = ['category'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function getParentCategoryIdAttribute()
    {
        return $this->category->parent->id;
    }

    public function getParentCategoryNameAttribute()
    {
        return $this->category->parent->name;
    }

    public function getCategoryNameAttribute()
    {
        return $this->category->name;
    }

    public function getCategoryIconAttribute()
    {
        return $this->category->icon;
    }

    public function getCategoryColorAttribute()
    {
        return $this->category->color;
    }

    public function getMonthsRemainingAttribute()
    {
        $now = Carbon::now()->startOfMonth();
        $due = Carbon::parse($this->due_date)->startOfMonth();
        return max(0, (int) $now->diffInMonths($due));
    }

    public function getMonthlyAmountAttribute()
    {
        $months = $this->months_remaining;
        if ($months <= 0) {
            return $this->amount;
        }
        return round($this->amount / $months, 2);
    }
}
