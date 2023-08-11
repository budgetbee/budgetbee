<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('imports', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->softDeletes();
            $table->string('file_name');
            $table->string('file_extension');
            $table->float('file_size');
            $table->unsignedBigInteger('user_id');

            $table->foreign('user_id')->references('id')->on('users');
        });

        Schema::table('records', function (Blueprint $table) {
            $table->string('code', 255)->nullable();
            $table->unique('code');
            $table->unsignedBigInteger('import_id')->nullable();

            $table->foreign('import_id')->references('id')->on('imports');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('imports');
    }
};
