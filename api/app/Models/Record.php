<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Record extends Model
{
    /**
     * The attributes that are mass assignable.
     *
     * @var string[]
     */
    protected $fillable = [
        'date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'description', 'amount', 'bank_code', 'link_record_id'
    ];

    protected $appends = ['parent_category_icon', 'parent_category_name', 'parent_category_id', 'category_name', 'category_color', 'account_name', 'to_account_name', 'account_type_name', 'icon'];

    protected $hidden = ['category', 'account', 'toAccount'];

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

    public function updateAccounts()
    {

        $account = Account::find($this->from_account_id);
        $currentBalance = $account->current_balance + $this->amount;
        $account->fill(['current_balance' => $currentBalance]);
        $account->save();

        if ($this->type == 'transfer') {

            $linkRecord = ($this->link_record_id) ? Record::find($this->link_record_id) : new Record();
            $linkRecord->fill([
                'link_record_id' => $this->id,
                'amount' => -$this->amount,
                'date' => $this->date,
                'from_account_id' => $this->to_account_id,
                'to_account_id' => $this->from_account_id,
                'type' => $this->type,
                'name' => '',
                'category_id' => $this->category_id
            ]);
            $linkRecord->save();

            $this->fill(['link_record_id' => $linkRecord->id]);
            $this->save();

            $account = Account::find($linkRecord->from_account_id);
            $currentBalance = $account->current_balance + $linkRecord->amount;
            $account->fill(['current_balance' => $currentBalance]);
            $account->save();
        }
    }
}
