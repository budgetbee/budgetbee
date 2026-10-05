<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Deterministic auto-categorisation: rules, learning candidates and the
 * per-record classification metadata.
 *
 * No user data is touched: every column added is nullable and nothing is
 * backfilled here.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_rules', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->unsignedBigInteger('user_id');
            // merchant_key: matches the normalised merchant key.
            // text: matches the raw description text (user-created rules only).
            $table->string('match_field', 32)->default('merchant_key');
            // equals | starts_with | contains | regex
            $table->string('operator', 16)->default('equals');
            $table->string('value');
            $table->unsignedBigInteger('category_id');
            $table->unsignedInteger('priority')->default(100);
            // manual (user) | learned (from confirmations) | ai (never auto-promoted)
            $table->string('source', 16)->default('manual');
            $table->unsignedInteger('hits')->default(0);
            $table->timestamp('last_hit_at')->nullable();
            $table->boolean('enabled')->default(true);

            $table->index(['user_id', 'enabled', 'match_field', 'value'], 'category_rules_lookup');
            $table->index(['user_id', 'priority'], 'category_rules_order');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('category_id')->references('id')->on('categories');
        });

        Schema::create('category_candidates', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->unsignedBigInteger('user_id');
            $table->string('merchant_key');
            $table->unsignedBigInteger('category_id');
            $table->unsignedInteger('confirmations')->default(0);
            $table->unsignedInteger('contradictions')->default(0);
            $table->timestamp('last_seen_at')->nullable();

            $table->unique(['user_id', 'merchant_key', 'category_id'], 'category_candidates_unique');
            $table->foreign('user_id')->references('id')->on('users');
            $table->foreign('category_id')->references('id')->on('categories');
        });

        Schema::table('records', function (Blueprint $table) {
            $table->string('merchant_key')->nullable()->after('name');
            // rule | learned | history | ai | manual | null (nothing was known)
            $table->string('category_source', 16)->nullable()->after('category_id');
            $table->decimal('category_confidence', 4, 3)->nullable()->after('category_source');

            $table->index(['user_id', 'merchant_key'], 'records_merchant_key_index');
        });
    }

    public function down(): void
    {
        Schema::table('records', function (Blueprint $table) {
            $table->dropIndex('records_merchant_key_index');
            $table->dropColumn(['merchant_key', 'category_source', 'category_confidence']);
        });

        Schema::dropIfExists('category_candidates');
        Schema::dropIfExists('category_rules');
    }
};
