<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('insights', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('type');          // summary | forecast | subscriptions | increase
            $table->string('period_key');    // e.g. w-2026-09-07 (week) or m-2026-09 (month)
            $table->string('title');
            $table->text('body');
            $table->json('data')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamp('dismissed_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'type', 'period_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('insights');
    }
};
