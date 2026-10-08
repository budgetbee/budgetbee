<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The user's autocategoriser switch, and the two marks of its onboarding.
 *
 * The autocategoriser applies the rules learned from the user's own movements to
 * what comes in later. It arrives OFF: filing movements on its own is something
 * the user asks for, not something that happens to him on an update. The modal
 * and the card explain the switch, and each of them is shown once per user —
 * hence the two marks, which are what stop them coming back.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('auto_categorize_enabled')->default(false)->after('currency_id');
            $table->timestamp('categorization_intro_seen_at')->nullable()->after('auto_categorize_enabled');
            $table->timestamp('categorization_card_seen_at')->nullable()->after('categorization_intro_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'auto_categorize_enabled',
                'categorization_intro_seen_at',
                'categorization_card_seen_at',
            ]);
        });
    }
};
