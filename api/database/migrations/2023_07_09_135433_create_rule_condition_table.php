<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('rule_conditions', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->text('condition')->nullable();
            $table->unsignedBigInteger('user_id');
            $table->unsignedBigInteger('rule_id');
            $table->unsignedBigInteger('rule_condition_type_id');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('rule_id')->references('id')->on('rules');
            $table->foreign('rule_condition_type_id')->references('id')->on('rule_condition_types');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('rule_condition');
    }
};
