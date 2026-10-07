<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The words the user told the categoriser to stop reading.
 *
 * A bank writes the same wording in every line ("card payment", "transfer
 * received") and puts it in front of the merchant. When the user marks such a
 * suggestion as ignored, it is not only that suggestion that goes away: those
 * words stop being read when the merchant key is built, so the words that come
 * after (the shop) become the key.
 *
 * Nothing is listed by default and no bank vocabulary is shipped anywhere: the
 * only words on this table are the ones the user marked himself.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('category_ignored_phrases', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('user_id');
            $table->string('phrase');
            $table->timestamps();

            $table->unique(['user_id', 'phrase']);
            $table->index('user_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('category_ignored_phrases');
    }
};
