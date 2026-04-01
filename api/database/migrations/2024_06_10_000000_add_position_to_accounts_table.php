<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->unsignedInteger('position')->default(0)->after('currency_id');
        });

        // Populate existing accounts with sequential positions per user
        $users = DB::table('accounts')
            ->select('user_id')
            ->distinct()
            ->pluck('user_id');

        foreach ($users as $userId) {
            $accounts = DB::table('accounts')
                ->where('user_id', $userId)
                ->orderBy('id')
                ->pluck('id');

            foreach ($accounts as $index => $id) {
                DB::table('accounts')
                    ->where('id', $id)
                    ->update(['position' => $index]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('accounts', function (Blueprint $table) {
            $table->dropColumn('position');
        });
    }
};
