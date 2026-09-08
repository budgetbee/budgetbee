<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add enabled (soft disable) and position (manual ordering) to both
     * category tables. Disabled categories keep their data so existing
     * records still show name/icon/color; they are only hidden from the
     * pickers used when creating new records.
     */
    public function up(): void
    {
        Schema::table('parent_categories', function (Blueprint $table) {
            $table->boolean('enabled')->default(true)->after('icon');
            $table->unsignedInteger('position')->default(0)->after('enabled');
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->boolean('enabled')->default(true)->after('icon');
            $table->unsignedInteger('position')->default(0)->after('enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('parent_categories', function (Blueprint $table) {
            $table->dropColumn(['enabled', 'position']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropColumn(['enabled', 'position']);
        });
    }
};
