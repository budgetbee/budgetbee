<?php

namespace App\Http\Controllers;

use App\Services\Categorization\CategoryClassifier;
use App\Services\Categorization\CategoryCorpus;
use App\Services\Categorization\CategoryLearner;

use Illuminate\Http\Request;
use App\Models\Record;
use App\Models\Category;
use DateTime;

class RecordController extends Controller
{

    public function get(Request $request)
    {
        $records = Record::where('user_id', $request->user()->id);

        if ($request->has('search_term')) {
            $term = str_replace(['%', '_'], ['\\%', '\\_'], $request->query('search_term'));
            $records->where('name', 'like', '%' . $term . '%');
        }
        if ($request->has('type')) {
            $records->where('type', $request->query('type'));
        }
        if ($request->has('account_id')) {
            $accountIds = $request->query('account_id');
            if (!is_array($accountIds)) {
                $accountIds = [$accountIds];
            }
            $records->where(function ($q) use ($accountIds) {
                $q->whereIn('from_account_id', $accountIds)
                  ->orWhereIn('to_account_id', $accountIds);
            });
        }
        if ($request->has('category_id')) {
            $catName = Category::find((int) $request->query('category_id'))?->name;
            if ($catName) {
                $allCatIds = Category::where('name', $catName)->pluck('id');
                $records->whereIn('category_id', $allCatIds);
            } else {
                $records->whereRaw('1 = 0');
            }
        }
        if ($request->has('parent_category_id')) {
            $parentCatName = \App\Models\ParentCategory::find((int) $request->query('parent_category_id'))?->name;
            if ($parentCatName) {
                $allParentIds = \App\Models\ParentCategory::where('name', $parentCatName)->pluck('id');
                $categoryIds = Category::whereIn('parent_category_id', $allParentIds)->pluck('id');
                $records->whereIn('category_id', $categoryIds);
            } else {
                $records->whereRaw('1 = 0'); // unknown parent category → no results
            }
        }
        if ($request->has('from_date')) {
            $records->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $records->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }
        if ($request->has('amount_min')) {
            $records->whereRaw('ABS(amount) >= ?', [abs((float) $request->query('amount_min'))]);
        }
        if ($request->has('amount_max')) {
            $records->whereRaw('ABS(amount) <= ?', [abs((float) $request->query('amount_max'))]);
        }

        $page = $request->query('page');
        if ($page > 0) {
            $perPage = 20;
            $records->skip(($page - 1) * $perPage)
                ->take($perPage);
        }

        $data = $records->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($data);
    }

    public function getById($id)
    {
        $record = Record::where('id', $id)->first();

        $this->authorize('view', $record);

        return response()->json($record);
    }

    public function create(Request $request)
    {
        // The record form sends an empty category_id when nothing was picked.
        // Treat it as absent so it falls back to the user's unknown category,
        // instead of failing the "integer" rule and reporting a missing category.
        if ($request->input('category_id') === '' || $request->input('category_id') === null) {
            $request->merge(['category_id' => null]);
        }

        $this->validate($request, [
            'date' => 'required|date',
            'from_account_id' => 'required|integer|exists:App\Models\Account,id',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'category_id' => 'nullable|integer|exists:App\Models\Category,id',
            'name' => 'nullable|string',
            'type' => 'required|string|in:income,expense,transfer',
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric',
            'code' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate', 'code');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
            ]);
            $data['rate'] = $data['rate'] ?? 1;
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $data['category_id'] = $data['category_id'] ?? $this->fallbackCategoryId((int) $request->user()->id);
        $data['user_id'] = $request->user()->id;

        $record = new Record();
        $record->fill($data);
        // The key is built against this user's own movements: the words his bank
        // repeats in every line are not part of a merchant name.
        $record->merchant_key = (new CategoryClassifier(
            app(CategoryCorpus::class)->normalizerFor(
                (int) $record->user_id,
                (int) ($record->from_account_id ?: $record->to_account_id) ?: null
            )
        ))->merchantKey($record->name ?: $record->description);
        $record->save();

        // Learning input: what the user creates by hand is the highest quality
        // evidence there is.
        if ($record->merchant_key) {
            (new CategoryLearner())->confirm(
                (int) $record->user_id,
                $record->merchant_key,
                (int) $record->category_id
            );
        }

        return response()->json(['id' => $record->id]);
    }

    /**
     * Suggest a category for a movement text. READ ONLY: it never writes
     * anything and it never guesses when the text has no merchant information.
     *
     * It answers with what the user's RULES say, manual or learned: this is the
     * live suggestion of the record form while he types the concept. History is
     * left out on purpose, so the suggestion is always something he (or the
     * categoriser) decided at some point.
     */
    public function predict(Request $request)
    {
        $this->validate($request, [
            'text' => 'nullable|string|max:500',
        ]);

        $userId = (int) $request->user()->id;
        // Same key as the one the movement will get once it is saved.
        $classifier = new CategoryClassifier(
            app(CategoryCorpus::class)->normalizerFor($userId, null, [(string) $request->input('text')])
        );
        $merchantKey = $classifier->merchantKey($request->input('text'));

        if ($merchantKey === null) {
            // No usable merchant text: nothing is suggested on purpose.
            return response()->json([
                'merchant_key' => null,
                'prediction' => null,
                'reason' => 'no_usable_text',
            ]);
        }

        $prediction = $classifier->classifyByRules($userId, $request->input('text'));

        if ($prediction === null) {
            return response()->json([
                'merchant_key' => $merchantKey,
                'prediction' => null,
                'reason' => 'no_evidence',
            ]);
        }

        // The id comes from one of the user's own rules, so looking it up by id
        // is safe: it can only be a category he already used.
        $category = Category::find($prediction['category_id']);

        return response()->json([
            'merchant_key' => $merchantKey,
            'prediction' => [
                'category_id' => $prediction['category_id'],
                'category_name' => $category?->name,
                'source' => $prediction['source'],
                'confidence' => $prediction['confidence'],
            ],
        ]);
    }

    /**
     * Fallback category for a movement created without one: ALWAYS inside the
     * user's own categories ("Desconocido" if it exists). A hardcoded id can
     * point to another user's row on a shared installation.
     */
    private function fallbackCategoryId(int $userId): int
    {
        $scoped = function ($q) use ($userId) {
            $q->where('user_id', $userId)->orWhereNull('user_id');
        };

        $unknown = Category::where($scoped)
            ->where(function ($q) {
                $q->where('name', 'like', '%esconocid%')
                    ->orWhere('name', 'like', '%nknown%')
                    ->orWhere('name', 'like', '%uncategor%')
                    ->orWhere('name', 'like', '%sin categor%');
            })
            ->orderBy('id')
            ->first();

        if ($unknown) {
            return (int) $unknown->id;
        }

        $fallback = Category::firstByParentType($userId, 'expense');
        if ($fallback) {
            return (int) $fallback->id;
        }

        return (int) Category::where($scoped)->min('id');
    }

    public function update(Request $request, $id)
    {
        $record = Record::find($id);

        $this->authorize('update', $record);

        $this->validate($request, [
            'date' => 'required|date',
            'from_account_id' => 'required|integer|exists:App\Models\Account,id',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'type' => 'required|string|in:income,expense,transfer',
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric',
            'name' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
            ]);
            $data['rate'] = $data['rate'] ?? 1;
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $record->fill($data);
        $record->save();

        return response()->json($record);
    }

    public function delete($id)
    {
        $record = Record::find($id);

        $this->authorize('delete', $record);

        $record->delete();

        return response()->json([]);
    }

    public function getLastRecords(Request $request)
    {
        $query = Record::where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $accountId = $request->query('account_id');
            $query->where(function ($q) use ($accountId) {
                $q->where('from_account_id', $accountId)
                  ->orWhere('to_account_id', $accountId);
            });
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }
        if ($request->has('search_term')) {
            $term = str_replace(['%', '_'], ['\\%', '\\_'], $request->query('search_term'));
            $query->where('name', 'like', '%' . $term . '%');
        }
        if ($request->has('limit')) {
            $query->limit($request->query('limit'));
        }

        $records = $query->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($records);
    }

    public function getRecordsByCategory(Request $request, $id)
    {
        $records = Record::where('category_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderByDesc('date')
            ->orderByDesc('id');
        if ($request->query('from')) {
            $records->where('date', '>=', (new DateTime($request->query('from')))->format('Y-m-d'));
        }
        if ($request->query('to')) {
            $records->where('date', '<=', (new DateTime($request->query('to')))->format('Y-m-d'));
        }
        $records = $records->get();

        return response()->json($records);
    }
}
