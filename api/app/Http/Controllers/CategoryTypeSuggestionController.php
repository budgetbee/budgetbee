<?php

namespace App\Http\Controllers;

use App\Models\ParentCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CategoryTypeSuggestionController extends Controller
{
    /**
     * One time notice after the income/expense detection changed.
     *
     * Parent categories are now typed (income / expense / transfer) and every
     * chart, report and balance decides from that flag. On an installation
     * coming from an older version the flag is on the default, so the user is
     * shown this once: what changed, which categories look like income to us,
     * and a way to review them by hand.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $suggestions = $this->suggestions($user->id);

        return response()->json([
            // Only bother the user when there is something to fix: an
            // installation created with this version already has its categories
            // typed, and a notice claiming they predate the flag would be wrong
            // for it. With nothing to suggest, there is nothing to tell.
            'should_prompt' => $user->category_types_intro_seen_at === null && count($suggestions) > 0,
            'tour_seen' => $user->category_types_tour_seen_at !== null,
            'suggestions' => $suggestions,
        ]);
    }

    /**
     * Mark the categories the user accepted as income and close the notice.
     */
    public function accept(Request $request)
    {
        $data = $request->validate([
            'ids' => 'array',
            'ids.*' => 'integer',
        ]);

        $ids = $data['ids'] ?? [];
        $updated = 0;

        if (!empty($ids)) {
            // Scoped to the user's own categories: an id belonging to somebody
            // else is ignored instead of touched.
            $updated = ParentCategory::where('user_id', $request->user()->id)
                ->whereIn('id', $ids)
                ->update(['type' => 'income']);
        }

        $this->markIntroSeen($request->user());

        return response()->json(['updated' => $updated]);
    }

    /**
     * Close the notice without touching anything.
     */
    public function dismiss(Request $request)
    {
        $this->markIntroSeen($request->user());

        return response()->json(['dismissed' => true]);
    }

    /**
     * The short explanation of the category screen has been read.
     */
    public function tourSeen(Request $request)
    {
        $user = $request->user();

        if ($user->category_types_tour_seen_at === null) {
            $user->forceFill(['category_types_tour_seen_at' => now()])->save();
        }

        return response()->json(['tour_seen' => true]);
    }

    /**
     * Categories that look like income and are not marked as income yet.
     *
     * Two signals, in this order:
     *   - the name of the seeded category ("Incomes", or "Ingresos" on the
     *     installations seeded before the names were translated), matched
     *     whole, so something like "Income tax" is not suggested;
     *   - the records already inside it, when income ones predominate. This is
     *     what catches a category renamed or created by the user, and the other
     *     users of a shared installation.
     */
    private function suggestions(int $userId): array
    {
        $parents = ParentCategory::where('user_id', $userId)
            ->where('type', '!=', 'income')
            ->orderBy('id')
            ->get(['id', 'name']);

        $counts = $this->recordCountsByParent($userId);
        $suggestions = [];

        foreach ($parents as $parent) {
            $income = (int) ($counts[$parent->id]['income'] ?? 0);
            $expense = (int) ($counts[$parent->id]['expense'] ?? 0);

            if ($this->looksLikeIncomeName($parent->name)) {
                $reason = 'name';
            } elseif ($income > 0 && $income > $expense) {
                $reason = 'records';
            } else {
                continue;
            }

            $suggestions[] = [
                'id' => $parent->id,
                'name' => $parent->name,
                'reason' => $reason,
                'income_records' => $income,
                'expense_records' => $expense,
            ];
        }

        return $suggestions;
    }

    /**
     * Number of income and expense records per parent category of the user.
     * Transfers are left out: they are neither.
     */
    private function recordCountsByParent(int $userId): array
    {
        $rows = DB::table('records')
            ->join('categories', 'categories.id', '=', 'records.category_id')
            ->join('parent_categories', 'parent_categories.id', '=', 'categories.parent_category_id')
            ->where('records.user_id', $userId)
            ->where('parent_categories.user_id', $userId)
            ->whereIn('records.type', ['income', 'expense'])
            ->select('parent_categories.id as parent_id', 'records.type', DB::raw('COUNT(*) as total'))
            ->groupBy('parent_categories.id', 'records.type')
            ->get();

        $counts = [];

        foreach ($rows as $row) {
            $counts[$row->parent_id][$row->type] = (int) $row->total;
        }

        return $counts;
    }

    private function looksLikeIncomeName(?string $name): bool
    {
        return (bool) preg_match('/^\s*(incomes?|ingresos?)\s*$/iu', (string) $name);
    }

    private function markIntroSeen($user): void
    {
        if ($user->category_types_intro_seen_at === null) {
            $user->forceFill(['category_types_intro_seen_at' => now()])->save();
        }
    }
}
