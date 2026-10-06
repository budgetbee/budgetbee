<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Remembers, per user and per file shape, which column holds which field.
     *
     * The signature is a hash of the normalised column names, so the same bank
     * export is recognised next month and the mapping screen comes up already
     * filled in. Kept per user: two people importing the same bank file must not
     * inherit each other's choices.
     */
    public function up(): void
    {
        Schema::create('import_column_mappings', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('signature', 64);
            $table->string('file_format', 8)->nullable();
            // field => column index, e.g. {"date":0,"name":2,"amount":3}
            $table->json('mapping');
            // Optional account the movements belong to (bank exports have none).
            $table->unsignedBigInteger('account_id')->nullable();
            $table->timestamps();

            $table->unique(['user_id', 'signature']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('import_column_mappings');
    }
};
