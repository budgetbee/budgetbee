<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoanPayment extends Model
{
    protected $table = 'loan_payments';

    protected $fillable = [
        'loan_id',
        'record_id',
        'amount',
        'payment_date',
    ];

    protected $casts = [
        'payment_date' => 'date',
    ];

    public function loan()
    {
        return $this->belongsTo(Loan::class);
    }

    public function record()
    {
        return $this->belongsTo(Record::class);
    }
}
