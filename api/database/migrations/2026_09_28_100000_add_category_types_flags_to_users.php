<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Parent categories became typed (income / expense / transfer) and every
     * chart, report and balance now decides from that flag. An installation
     * coming from an older version has its categories on the default value, so
     * the user has to be told what changed and helped to mark their income
     * categories.
     *
     * Nothing is changed on their data: these two timestamps only record that
     * the one time notice (and the short tour of the category screen) has been
     * shown, so it never comes back.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('category_types_intro_seen_at')->nullable()->after('email_verified_at');
            $table->timestamp('category_types_tour_seen_at')->nullable()->after('category_types_intro_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['category_types_intro_seen_at', 'category_types_tour_seen_at']);
        });
    }
};
