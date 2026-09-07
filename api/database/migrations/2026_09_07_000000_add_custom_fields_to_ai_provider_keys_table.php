<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Add optional per-provider configuration (custom OpenAI-compatible endpoints).
     */
    public function up(): void
    {
        Schema::table('ai_provider_keys', function (Blueprint $table) {
            // Base URL for OpenAI-compatible providers (Ollama, Open WebUI, vLLM, ...).
            // When null, the built-in default endpoint for the provider is used.
            $table->string('base_url', 500)->nullable()->after('api_key');

            // Model name override (e.g. "gpt-oss:20b", "llama3.1"). When null, the
            // provider's default model is used.
            $table->string('model', 200)->nullable()->after('base_url');

            // Whether the configured model supports vision (image analysis).
            $table->boolean('supports_vision')->default(false)->after('model');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_provider_keys', function (Blueprint $table) {
            $table->dropColumn(['base_url', 'model', 'supports_vision']);
        });
    }
};
