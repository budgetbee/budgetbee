<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Database\Factories\RecordFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\Factory;

class Record extends Model
{
    use SoftDeletes;
    use HasFactory;
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'user_id', 'date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'description', 'amount', 'bank_code', 'link_record_id'
    ];

    protected $appends = ['parent_category_icon', 'parent_category_name', 'parent_category_id', 'category_name', 'category_color', 'account_name', 'to_account_name', 'account_type_name', 'icon'];

    protected $hidden = ['category', 'account', 'toAccount'];

    public static function newFactory(): Factory
    {
        return RecordFactory::new();
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class, 'from_account_id', 'id');
    }

    public function toAccount()
    {
        return $this->belongsTo(Account::class, 'to_account_id', 'id');
    }

    public function getCategoryNameAttribute()
    {
        return $this->category->name;
    }

    public function getParentCategoryIdAttribute()
    {
        return $this->category->parent->id;
    }

    public function getParentCategoryNameAttribute()
    {
        return $this->category->parent->name;
    }

    public function getCategoryColorAttribute()
    {
        return $this->category->parent->color;
    }

    public function getParentCategoryIconAttribute()
    {
        return $this->category->parent->icon;
    }

    public function getAccountNameAttribute()
    {
        return $this->account->name;
    }

    public function getToAccountNameAttribute()
    {
        return ($this->toAccount) ? $this->toAccount->name : '';
    }

    public function getAccountTypeNameAttribute()
    {
        return $this->account->type_name;
    }

    public function getIconAttribute()
    {
        return $this->category->icon;
    }
}
