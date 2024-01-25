<?php

namespace App\Models;

use Carbon\Carbon;
use App\Services\CurrencyConverter;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Budget extends Model
{
    use HasFactory;

    protected $fillable = ['category_id', 'amount', 'user_id'];

    protected $appends = ['parent_category_id', 'parent_category_name', 'category_name', 'category_icon', 'category_color', 'spent', 'spent_percent'];

    protected $hidden = ['category'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function getParentCategoryidAttribute()
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

    public function getSpentAttribute()
    {
        $records = Record::where('user_id', auth()->user()->id)
            ->where('category_id', $this->category_id)
            ->whereYear('date', Carbon::now()->year)
            ->whereMonth('date', Carbon::now()->month)
            ->get();

        return $records->reduce(function ($carry, $record) {
            return $carry + CurrencyConverter::convertToUserCurrency($record);
        }, 0) * -1;
    }

    public function getSpentPercentAttribute()
    {
        return round($this->spent * 100 / $this->amount, 2);
    }
}
