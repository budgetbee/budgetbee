<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Loans/debts tracking (issue #140): a loan is money you owe ("owed") or
     * money someone owes you ("receivable"), paid back in flexible instalments.
     * Each registered payment optionally generates a normal Record so the loan
     * lifecycle is fully reflected in reports, budgets and the AI assistant.
     */
    public function up(): void
    {
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->softDeletes();
            $table->unsignedBigInteger('user_id');
            $table->string('name');
            // 'owed' = I borrowed money and must pay it back (liability)
            // 'receivable' = I lent money / sold on credit and must collect (asset)
            $table->string('direction')->default('owed');
            $table->decimal('total_amount', 15, 2);
            // Account the money moves through when payments are registered
            // (the account you pay from / receive into).
            $table->unsignedBigInteger('account_id')->nullable();
            // Category used for the auto-generated record on each payment.
            $table->unsignedBigInteger('category_id')->nullable();
            $table->date('start_date')->nullable();
            $table->text('notes')->nullable();

            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('set null');
            $table->foreign('category_id')->references('id')->on('categories')->onDelete('set null');
        });

        Schema::create('loan_payments', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->unsignedBigInteger('loan_id');
            $table->unsignedBigInteger('record_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->date('payment_date');

            $table->foreign('loan_id')->references('id')->on('loans')->onDelete('cascade');
            $table->foreign('record_id')->references('id')->on('records')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('loan_payments');
        Schema::dropIfExists('loans');
    }
};
