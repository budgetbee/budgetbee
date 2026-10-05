<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('category_candidates', function (Blueprint $table) {
            // When the user says "ignore this suggestion": the merchant stops
            // being suggested and the categoriser stops applying it on its own.
            // The evidence is kept, only marked.
            $table->timestamp('ignored_at')->nullable()->after('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('category_candidates', function (Blueprint $table) {
            $table->dropColumn('ignored_at');
        });
    }
};
