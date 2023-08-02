<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Database\Factories\RecordFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Http\Request;
use DateTime;
use Illuminate\Support\Facades\Auth;
use App\Services\CurrencyConverter;

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

    protected $appends = ['parent_category_icon', 'parent_category_name', 'parent_category_id', 'category_name', 'category_color', 'account_name', 'to_account_name', 'account_type_name', 'icon', 'currency_symbol', 'amount_base_currency'];

    protected $hidden = ['category', 'account', 'toAccount'];

    public static function boot()
    {
        parent::boot();

        static::created(function ($record) {
            if ($record->type === 'transfer') {
                static::withoutEvents(function () use ($record) {
                    $recordAssoc = ($record->link_record_id) ? Record::find($record->link_record_id) : new Record();
                    $recordAssoc->fill([
                        'user_id' => $record->user_id,
                        'link_record_id' => $record->id,
                        'amount' => -$record->amount,
                        'date' => $record->date,
                        'from_account_id' => $record->to_account_id,
                        'to_account_id' => $record->from_account_id,
                        'type' => $record->type,
                        'name' => $record->name,
                        'category_id' => $record->category_id
                    ]);
                    $recordAssoc->save();

                    $record->fill(['link_record_id' => $recordAssoc->id]);
                    $record->save();
                });
            }
        });

        static::deleting(function ($record) {
            if ($record->type == 'transfer') {
                static::withoutEvents(function () use ($record) {
                    $recordAssoc = Record::find($record->link_record_id);
                    if ($recordAssoc) {
                        $recordAssoc->delete();
                    }
                });
            }
        });

        static::updating(function ($record) {
            if ($record->type == 'transfer' || $record->original['type'] === 'transfer') {
                static::withoutEvents(function () use ($record) {
                    $recordAssoc = Record::withTrashed()->find($record->link_record_id);
                    if ($recordAssoc) {
                        if ($record->original['type'] === 'transfer' && $record->type !== 'transfer') {
                            $recordAssoc->delete();
                        } else {
                            $transfercategory = 1;
                            $recordAssoc->restore();
                            $recordAssoc->fill([
                                'amount' => -$record->amount,
                                'date' => $record->date,
                                'from_account_id' => $record->to_account_id,
                                'to_account_id' => $record->from_account_id,
                                'type' => $record->type,
                                'name' => $record->name,
                                'category_id' => $transfercategory
                            ]);
                            $recordAssoc->save();
                            $record->fill(['category_id' => $transfercategory])
                                ->save();
                        }
                    }
                });
            }
        });
    }

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

    public function getCurrencySymbolAttribute()
    {
        return $this->account->currency_symbol;
    }

    public function getAmountBaseCurrencyAttribute()
    {
        return CurrencyConverter::convert($this->amount, $this->account->currency);
    }

    public function scopeFilterByRequest($query, Request $request, array $excludes = [])
    {
        $query->where('user_id', $request->user()->id);

        if ($request->has('account_id') && !in_array('account_id', $excludes)) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date') && !in_array('from_date', $excludes)) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date') && !in_array('to_date', $excludes)) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }
        if ($request->has('search_term') && !in_array('search_term', $excludes)) {
            $query->where('name', 'like', '%' . $request->query('search_term') . '%');
        }
        
        return $query;
    }
}
