<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rows the user asked to leave out of the file when importing it.
     *
     * Bank exports open with the holder and the balance and close with a total,
     * and not every one of those lines can be told apart from a movement by its
     * content. The numbers are the rows of the FILE (1-based), which is what the
     * user sees in their spreadsheet. Kept next to the column mapping because
     * the same export carries the same junk lines every month.
     */
    public function up(): void
    {
        Schema::table('import_column_mappings', function (Blueprint $table) {
            // e.g. [1,2,3,4,5,218]
            $table->json('skip_rows')->nullable()->after('mapping');
        });
    }

    public function down(): void
    {
        Schema::table('import_column_mappings', function (Blueprint $table) {
            $table->dropColumn('skip_rows');
        });
    }
};
