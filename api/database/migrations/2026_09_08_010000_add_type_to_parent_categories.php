<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Parent categories become typed: 'expense' (default), 'income' or
     * 'transfer'. Every chart/report/balance decides income vs expense from
     * this flag instead of hard-coded category ids/names.
     */
    public function up(): void
    {
        Schema::table('parent_categories', function (Blueprint $table) {
            $table->string('type', 10)->default('expense')->after('icon');
        });

        // Existing seeded categories: mark incomes and the technical
        // transfer category so calculations keep working without the
        // hard-coded "Incomes = id 10" assumption.
        DB::table('parent_categories')
            ->where('name', 'like', 'Incom%')
            ->update(['type' => 'income']);

        DB::table('parent_categories')
            ->where('name', 'Transfer')
            ->update(['type' => 'transfer']);
    }

    public function down(): void
    {
        Schema::table('parent_categories', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
