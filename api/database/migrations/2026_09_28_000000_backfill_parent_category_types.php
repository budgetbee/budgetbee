<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Give a type to the parent categories that existed before the column, for
     * installations upgrading from an earlier version.
     *
     * The previous migration only recognised the English seeded names
     * ("Incom%", "Transfer"), so a category named in another language, or
     * renamed at some point, stayed on the default. Charts, reports and balances
     * decide income vs expense from this flag, so the income category ended up
     * on the expense side and the income looked like it had disappeared.
     */
    public function up(): void
    {
        // The released versions identified these two by a hard-coded id: 1 for
        // transfers and 10 for incomes (constants in BalanceController, and the
        // same ids used by the AI tools). That id is what made renaming them
        // harmless, so whatever they are called now, these are the ones.
        DB::table('parent_categories')->where('id', 10)->update(['type' => 'income']);
        DB::table('parent_categories')->where('id', 1)->update(['type' => 'transfer']);

        // The ids above belong to the first user of the installation. Any other
        // user has their own categories, with their own ids, so for them the id
        // says nothing: the records inside the category are the evidence of what
        // it is. Only rows still on the default are considered, so a type the
        // user has set by hand is never overridden.
        $parents = DB::table('parent_categories')
            ->where('type', 'expense')
            ->whereNotIn('id', [1, 10])
            ->get(['id']);

        foreach ($parents as $parent) {
            $type = $this->typeFromRecords($parent->id);

            if ($type !== null) {
                DB::table('parent_categories')
                    ->where('id', $parent->id)
                    ->update(['type' => $type]);
            }
        }
    }

    /**
     * Dominant record type inside the category tree: a refund (an income record
     * inside an expense category) does not turn the category around, because
     * the majority of its records still decide.
     */
    private function typeFromRecords(int $parentCategoryId): ?string
    {
        $types = DB::table('records')
            ->join('categories', 'categories.id', '=', 'records.category_id')
            ->where('categories.parent_category_id', $parentCategoryId)
            ->whereNotNull('records.type')
            ->select('records.type', DB::raw('COUNT(*) as total'))
            ->groupBy('records.type')
            ->pluck('total', 'records.type');

        if ($types->isEmpty()) {
            return null;
        }

        $dominant = $types->sortDesc()->keys()->first();

        return in_array($dominant, ['income', 'expense', 'transfer'], true) ? $dominant : null;
    }

    /**
     * Data backfill: nothing to roll back that would not destroy a type the
     * user has set by hand since.
     */
    public function down(): void
    {
    }
};
