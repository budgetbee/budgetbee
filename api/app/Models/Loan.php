<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Loan extends Model
{
    use SoftDeletes;

    protected $table = 'loans';

    protected $fillable = [
        'user_id',
        'name',
        'direction',
        'total_amount',
        'account_id',
        'category_id',
        'start_date',
        'notes',
    ];

    protected $appends = [
        'total_paid',
        'remaining',
        'progress',
        'direction_label',
    ];

    public const DIRECTIONS = ['owed', 'receivable'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function account()
    {
        return $this->belongsTo(Account::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function payments()
    {
        return $this->hasMany(LoanPayment::class);
    }

    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function getTotalPaidAttribute(): float
    {
        return (float) $this->payments()->sum('amount');
    }

    public function getRemainingAttribute(): float
    {
        return max(0, (float) $this->total_amount - $this->getTotalPaidAttribute());
    }

    public function getProgressAttribute(): int
    {
        $total = (float) $this->total_amount;
        if ($total <= 0) {
            return 0;
        }

        return (int) round(min(100, ($this->getTotalPaidAttribute() / $total) * 100));
    }

    public function getDirectionLabelAttribute(): string
    {
        return $this->direction === 'owed' ? 'I owe' : 'Owed to me';
    }
}
