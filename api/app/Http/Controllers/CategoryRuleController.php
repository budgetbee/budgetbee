<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CategoryCandidate;
use App\Models\CategoryRule;
use App\Models\ParentCategory;
use App\Models\Record;
use App\Services\Categorization\CategoryClassifier;
use App\Services\Categorization\CategoryCorpus;
use App\Services\Categorization\CategoryIgnoredPhrases;
use App\Services\Categorization\MerchantKeyRebuilder;
use App\Services\Categorization\CategoryLearner;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Auto-categorisation rules: list, create, update, delete, and a tester that
 * runs a candidate rule against the user's own movements before saving it.
 *
 * Everything is scoped to the authenticated user. Nothing here is written by
 * the AI: rules are created by the user or promoted by CategoryLearner.
 */
class CategoryRuleController extends Controller
{
    /**
     * How many movements are loaded to match the rules against. One query per
     * screen: the number next to a rule and the list behind it are counted from
     * the same rows, so the two always agree.
     */
    private const MATCHABLE_LIMIT = 5000;

    /**
     * Rules of the user plus the evidence behind them.
     */
    /**
     * Classifier primed with the user's own movements: the words his bank
     * repeats in every line are not part of any merchant name, and taking them
     * as the key makes every shop share one key.
     */
    private function classifierFor(int $userId): CategoryClassifier
    {
        return new CategoryClassifier(app(CategoryCorpus::class)->normalizerFor($userId));
    }

    public function index(Request $request)
    {
        $userId = (int) $request->user()->id;

        $rules = CategoryRule::forUser($userId)
            ->where('enabled', true)
            ->with(['category:id,name,icon,parent_category_id', 'category.parent:id,name,color'])
            ->orderByRaw("FIELD(source, 'manual', 'learned', 'ai')")
            ->orderBy('priority')
            ->orderByDesc('hits')
            ->get();

        // The number next to a rule is exactly what clicking it will list, so both
        // are counted by the same code (see matchingRecords). `hits` is left as it
        // is: it is a running counter of what the importer applied, kept for the
        // learner, not what is on screen.
        $allRecords = $rules->isEmpty() ? collect() : $this->matchableRecords($userId);
        $classifier = $this->classifierFor($userId);

        $rules = $rules->map(fn (CategoryRule $rule) => [
            'id' => $rule->id,
            'match_field' => $rule->match_field,
            'operator' => $rule->operator,
            'value' => $rule->value,
            'category_id' => $rule->category_id,
            'category_name' => $rule->category?->name,
            // The screen groups the rules by category and paints the group
            // header with the category icon and colour, so it needs them.
            'category_color' => $rule->category?->parent?->color,
            'icon' => $rule->category?->icon,
            'parent_name' => $rule->category?->parent?->name,
            'priority' => $rule->priority,
            'source' => $rule->source,
            'matching_records' => $this->matchingRecords(
                $allRecords,
                $classifier,
                $rule->match_field,
                $rule->operator,
                strtoupper(trim((string) $rule->value)),
                (int) $rule->category_id
            )->count(),
            'hits' => $rule->hits,
            'enabled' => (bool) $rule->enabled,
            'last_hit_at' => $rule->last_hit_at?->toIso8601String(),
        ]);

        $ignored = $this->ignoredEvidence($userId);

        return response()->json([
            'rules' => $rules,
            'candidates' => $this->candidateEvidence($userId),
            // What the user said no to, so he can see it and put it back.
            'ignored' => $ignored,
            'category_choices' => $this->categoryChoices($userId),
            'summary' => [
                'rules' => $rules->count(),
                'learned' => $rules->where('source', CategoryRule::SOURCE_LEARNED)->count(),
                'manual' => $rules->where('source', CategoryRule::SOURCE_MANUAL)->count(),
                // Rules the user removed stay in the table (disabled) so the
                // learner never brings them back on its own.
                'removed' => CategoryRule::forUser($userId)->where('enabled', false)->count(),
                'with_key' => Record::where('user_id', $userId)->whereNotNull('merchant_key')->count(),
                'ignored' => count($ignored),
            ],
        ]);
    }

    /**
     * Evidence collected so far: how close each merchant is to a rule.
     */
    public function candidates(Request $request)
    {
        return response()->json($this->candidateEvidence((int) $request->user()->id));
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $userId = (int) $request->user()->id;

        // A rule may only point at a category the user can actually use: his own
        // or one his own movements already carry. Without this, a rule could
        // reference another user's category row.
        if (! $this->categoryBelongsToUser($userId, (int) $data['category_id'])) {
            return response()->json(['error' => 'Invalid category'], 422);
        }

        $rule = new CategoryRule();
        $rule->user_id = $userId;
        $rule->match_field = $data['match_field'] ?? 'merchant_key';
        $rule->operator = $data['operator'];
        $rule->value = strtoupper(trim($data['value']));
        $rule->category_id = (int) $data['category_id'];
        $rule->priority = (int) ($data['priority'] ?? 100);
        $rule->source = CategoryRule::SOURCE_MANUAL;
        $rule->enabled = $data['enabled'] ?? true;
        $rule->save();

        return response()->json(['id' => $rule->id]);
    }

    public function update(Request $request, $id)
    {
        $userId = (int) $request->user()->id;

        $rule = CategoryRule::forUser($userId)->find($id);
        if (! $rule) {
            return response()->json(['error' => 'Rule not found'], 404);
        }

        $data = $request->validate([
            'operator' => 'sometimes|in:' . implode(',', CategoryRule::OPERATORS),
            'value' => 'sometimes|string|max:255',
            'category_id' => 'sometimes|integer',
            'priority' => 'sometimes|integer|min:1|max:9999',
            'enabled' => 'sometimes|boolean',
            'match_field' => 'sometimes|in:' . implode(',', CategoryRule::FIELDS),
        ]);

        if (isset($data['category_id']) && ! $this->categoryBelongsToUser($userId, (int) $data['category_id'])) {
            return response()->json(['error' => 'Invalid category'], 422);
        }

        if (isset($data['value'])) {
            $data['value'] = strtoupper(trim($data['value']));
        }

        $rule->fill(array_filter($data, fn ($value) => $value !== null));
        $rule->save();

        return response()->json(['id' => $rule->id]);
    }

    public function destroy(Request $request, $id)
    {
        $rule = CategoryRule::forUser((int) $request->user()->id)->find($id);
        if (! $rule) {
            return response()->json(['error' => 'Rule not found'], 404);
        }

        $rule->delete();

        return response()->json(['deleted' => true]);
    }

    /**
     * Test a rule against the user's own movements WITHOUT saving it.
     *
     * It reports how many movements match, how their categories are
     * distributed (a rule pointing at one category while matching three
     * different ones is a bad rule) and a few examples.
     */
    public function test(Request $request)
    {
        $data = $request->validate([
            'match_field' => 'nullable|in:' . implode(',', CategoryRule::FIELDS),
            'operator' => 'required|in:' . implode(',', CategoryRule::OPERATORS),
            'value' => 'required|string|max:255',
            'limit' => 'nullable|integer|min:10|max:5000',
        ]);

        $userId = (int) $request->user()->id;
        $field = $data['match_field'] ?? 'text';
        $operator = $data['operator'];
        $expected = strtoupper(trim($data['value']));
        $limit = (int) ($data['limit'] ?? 500);

        $records = Record::where('user_id', $userId)
            ->where(function ($q) {
                $q->whereNotNull('name')->orWhereNotNull('description');
            })
            ->orderByDesc('date')
            ->limit($limit)
            ->get(['id', 'name', 'description', 'merchant_key', 'category_id', 'date', 'amount', 'type', 'from_account_id', 'to_account_id']);

        $classifier = $this->classifierFor($userId);
        $scanned = 0;
        $matched = 0;
        $noKey = 0;
        $distribution = [];
        $examples = [];

        foreach ($records as $record) {
            $scanned++;

            $key = $record->merchant_key ?: $classifier->merchantKey($record->name ?: $record->description);
            if ($key === null) {
                $noKey++;
            }

            if (! $this->recordMatches($classifier, $record, $field, $operator, $expected)) {
                continue;
            }

            $matched++;
            $categoryId = (int) $record->category_id;
            $distribution[$categoryId] = ($distribution[$categoryId] ?? 0) + 1;

            if (count($examples) < 5) {
                // The screen paints each match as a flat row with the category
                // icon and colour, the amount and the date, so it needs more
                // than the plain text: same fields the movements list uses.
                $category = $record->category_id
                    ? Category::with('parent')->find($record->category_id)
                    : null;

                $examples[] = [
                    'id' => $record->id,
                    'merchant_key' => $key,
                    'text' => mb_substr((string) ($record->name ?: $record->description), 0, 60),
                    'category_id' => $category?->id,
                    'category_name' => $category?->name,
                    'category_color' => $category?->parent?->color,
                    'icon' => $category?->icon,
                    'date' => $record->date,
                    'amount' => (float) $record->amount,
                    'type' => $record->type,
                    'currency_symbol' => optional($record->account)->currency_symbol,
                ];
            }
        }

        // Names for the ids that appear in the user's own movements.
        $names = Category::whereIn('id', array_keys($distribution))->pluck('name', 'id');

        $categories = [];
        arsort($distribution);
        foreach ($distribution as $categoryId => $count) {
            $categories[] = [
                'category_id' => $categoryId,
                'category_name' => $names[$categoryId] ?? null,
                'count' => $count,
            ];
        }

        return response()->json([
            'scanned' => $scanned,
            'matched' => $matched,
            'without_key' => $noKey,
            'categories' => $categories,
            'examples' => $examples,
        ]);
    }

    /**
     * @return array<int,array<string,mixed>>
     */
    private function candidateEvidence(int $userId): array
    {
        return $this->evidence($userId, false);
    }

    /**
     * The suggestions the user said no to.
     *
     * They are kept on screen so he can see them and put one back if he changes
     * his mind: the evidence was never thrown away.
     *
     * @return array<int,array<string,mixed>>
     */
    private function ignoredEvidence(int $userId): array
    {
        return $this->evidence($userId, true);
    }

    /**
     * The evidence behind a suggestion.
     *
     * @param  bool  $ignored  false: what is still being suggested (a merchant the
     *                         user ignored is left out entirely). true: what he
     *                         ignored, for him to review or put back.
     * @return array<int,array<string,mixed>>
     */
    private function evidence(int $userId, bool $ignored): array
    {
        $config = (array) config('categorization', []);
        $minConfirmations = (int) ($config['min_confirmations'] ?? 3);
        $minShare = (float) ($config['min_share'] ?? 0.8);
        // Evidence is only offered on screen from this many sightings on: one
        // or two are a coincidence, and a screen full of coincidences is noise.
        $suggestMin = (int) ($config['suggest_min_confirmations'] ?? 3);

        $candidates = CategoryCandidate::forUser($userId)
            ->with(['category:id,name,icon,parent_category_id', 'category.parent:id,name,color'])
            ->orderByDesc('confirmations')
            ->get();

        // Merchants the user ignored on the screen: they stop being suggested,
        // even if more evidence arrives later (the marked row stays, so the key
        // stays out).
        $ignoredKeys = $candidates
            ->filter(fn (CategoryCandidate $candidate) => $candidate->ignored_at !== null)
            ->pluck('merchant_key')
            ->unique()
            ->flip();

        $grouped = [];
        foreach ($candidates as $candidate) {
            $isIgnored = $ignoredKeys->has($candidate->merchant_key);

            if ($ignored ? ! $isIgnored : $isIgnored) {
                continue;
            }

            $grouped[$candidate->merchant_key][] = $candidate;
        }

        // The number on a suggestion and the movements that open when it is clicked
        // come from the same live count (see matchingRecords), so the two agree.
        $allRecords = $this->matchableRecords($userId);
        $classifier = $this->classifierFor($userId);

        $out = [];
        foreach ($grouped as $merchantKey => $items) {
            // In the ignored tab the interesting evidence is the marked one.
            if ($ignored) {
                $marked = collect($items)->filter(fn (CategoryCandidate $candidate) => $candidate->ignored_at !== null);

                if ($marked->isNotEmpty()) {
                    $items = $marked->all();
                }
            }

            $total = (int) collect($items)->sum('confirmations');
            $top = collect($items)->sortByDesc('confirmations')->first();
            $confirmations = (int) $top->confirmations;

            // Not enough evidence to bother the user with: the merchant stays
            // out of the suggestions until it has been seen again. The ignored
            // ones are shown anyway: he put them there, they are his to review.
            if (! $ignored && $confirmations < $suggestMin) {
                continue;
            }

            $share = $total > 0 ? round($confirmations / $total, 3) : 0.0;

            $existingRule = CategoryRule::forUser($userId)
                ->where('match_field', 'merchant_key')
                ->where('value', $merchantKey)
                ->exists();

            $out[] = [
                'merchant_key' => $merchantKey,
                'category_id' => (int) $top->category_id,
                'category_name' => $top->category?->name,
                'category_color' => $top->category?->parent?->color,
                'icon' => $top->category?->icon,
                'confirmations' => $confirmations,
                'matching_records' => $this->matchingRecords(
                    $allRecords,
                    $classifier,
                    'merchant_key',
                    'equals',
                    (string) $merchantKey,
                    (int) $top->category_id
                )->count(),
                'contradictions' => (int) $top->contradictions,
                'total_evidence' => $total,
                'share' => $share,
                'missing_confirmations' => max(0, $minConfirmations - $confirmations),
                'has_rule' => $existingRule,
                'ready' => $confirmations >= $minConfirmations && $share >= $minShare,
                'ignored_at' => $ignored ? $top->ignored_at?->toIso8601String() : null,
            ];
        }

        usort($out, fn ($a, $b) => $b['confirmations'] <=> $a['confirmations']);

        return $out;
    }

    private function matches(string $operator, string $expected, string $subject): bool
    {
        if ($expected === '') {
            return false;
        }

        return match ($operator) {
            'equals' => $subject === $expected,
            'starts_with' => str_starts_with($subject, $expected),
            'contains' => str_contains($subject, $expected),
            'regex' => @preg_match('/' . str_replace('/', '\/', $expected) . '/u', $subject) === 1,
            default => false,
        };
    }

    /**
     * Categorise the user's existing movements that match a text, and turn the
     * match into a rule so future movements are categorised on their own.
     *
     * Example: every movement containing "LAURA" is a share of a subscription.
     */
    public function apply(Request $request)
    {
        $data = $request->validate([
            'operator' => 'required|in:' . implode(',', CategoryRule::OPERATORS),
            'value' => 'required|string|max:255',
            'match_field' => 'nullable|in:' . implode(',', CategoryRule::FIELDS),
            'category_id' => 'required|integer',
            'limit' => 'nullable|integer|min:1|max:5000',
        ]);

        $userId = (int) $request->user()->id;

        if (! $this->categoryBelongsToUser($userId, (int) $data['category_id'])) {
            return response()->json(['error' => 'Invalid category'], 422);
        }

        // "text" is the default: the user searches for what he sees on the
        // statement, not for an internal key.
        $field = $data['match_field'] ?? 'text';
        $operator = $data['operator'];
        $expected = strtoupper(trim($data['value']));
        $categoryId = (int) $data['category_id'];
        $limit = (int) ($data['limit'] ?? 5000);

        $records = Record::where('user_id', $userId)
            ->orderByDesc('date')
            ->limit($limit)
            ->get(['id', 'name', 'description', 'merchant_key', 'category_id']);

        $classifier = $this->classifierFor($userId);
        $ids = [];

        foreach ($records as $record) {
            if ((int) $record->category_id === $categoryId) {
                continue; // already where it should be
            }

            if ($this->recordMatches($classifier, $record, $field, $operator, $expected)) {
                $ids[] = $record->id;
            }
        }

        $applied = 0;
        foreach (array_chunk($ids, 500) as $chunk) {
            $applied += Record::where('user_id', $userId)->whereIn('id', $chunk)->update([
                'category_id' => $categoryId,
                'category_source' => 'rule',
                'category_confidence' => 1.0,
            ]);
        }

        // The rule itself, so this keeps happening on its own from now on.
        $rule = CategoryRule::firstOrNew([
            'user_id' => $userId,
            'match_field' => $field,
            'operator' => $operator,
            'value' => $expected,
        ]);
        $rule->category_id = $categoryId;
        $rule->priority = 50;
        $rule->source = CategoryRule::SOURCE_MANUAL;
        $rule->enabled = true;
        $rule->hits = (int) $rule->hits + $applied;
        $rule->last_hit_at = now();
        $rule->save();

        return response()->json([
            'applied' => $applied,
            'rule_id' => $rule->id,
            'value' => $rule->value,
            'match_field' => $rule->match_field,
            'category_id' => $categoryId,
        ]);
    }

    /**
     * The user says no to a suggestion.
     *
     * The merchant stops being suggested, and the categoriser stops applying it
     * on its own (see CategoryLearner::promoteIfReady). Nothing is thrown away:
     * the evidence rows stay, marked, and keep counting.
     */
    public function ignoreCandidate(Request $request)
    {
        $data = $request->validate([
            'merchant_key' => 'required|string|max:255',
        ]);

        $userId = (int) $request->user()->id;

        $ignored = CategoryCandidate::forUser($userId)
            ->where('merchant_key', $data['merchant_key'])
            ->update(['ignored_at' => now()]);

        // Saying no to a suggestion also means: stop reading those words when the
        // merchant is worked out. The movements that carried them get a new key
        // from what comes after (the shop), so they come back as suggestions of
        // their own instead of as one group of shops that have nothing to do
        // with each other.
        app(CategoryIgnoredPhrases::class)->ignore($userId, $data['merchant_key']);
        $rebuilt = app(MerchantKeyRebuilder::class)->rebuild($userId, [$data['merchant_key']]);

        return response()->json([
            'merchant_key' => $data['merchant_key'],
            'ignored' => $ignored,
            'moved' => $rebuilt['changed'],
            'keys' => array_keys($rebuilt['changes']),
        ]);
    }

    /**
     * Putting an ignored suggestion back.
     *
     * The evidence was never thrown away, so this only lifts the mark: the
     * merchant becomes suggestable (and learnable) again.
     */
    public function restoreCandidate(Request $request)
    {
        $data = $request->validate([
            'merchant_key' => 'required|string|max:255',
        ]);

        $userId = (int) $request->user()->id;

        $restored = CategoryCandidate::forUser($userId)
            ->where('merchant_key', $data['merchant_key'])
            ->update(['ignored_at' => null]);

        // Reading those words again changes the key of every movement they are in,
        // so the whole history is looked at again.
        app(CategoryIgnoredPhrases::class)->restore($userId, $data['merchant_key']);
        $rebuilt = app(MerchantKeyRebuilder::class)->rebuild($userId);

        return response()->json([
            'merchant_key' => $data['merchant_key'],
            'restored' => $restored,
            'moved' => $rebuilt['changed'],
        ]);
    }

    /**
     * The movements behind a count.
     *
     * A rule says "27 movements" and a suggestion says "5 movements
     * categorised like this": this returns those movements so the screen can
     * open them in the same modal the dashboard uses. They are full records,
     * with the same extras the movement card needs.
     *
     * The category is part of the question: a rule categorises into one
     * category, so only the movements of that category are listed.
     */
    public function records(Request $request)
    {
        $data = $request->validate([
            'match_field' => 'nullable|in:' . implode(',', CategoryRule::FIELDS),
            'operator' => 'required|in:' . implode(',', CategoryRule::OPERATORS),
            'value' => 'required|string|max:255',
            'category_id' => 'nullable|integer',
            'limit' => 'nullable|integer|min:1|max:500',
        ]);

        $userId = (int) $request->user()->id;
        $field = $data['match_field'] ?? 'text';
        $operator = $data['operator'];
        $expected = strtoupper(trim($data['value']));
        $max = (int) ($data['limit'] ?? 200);
        $categoryId = isset($data['category_id']) ? (int) $data['category_id'] : null;

        // The same code that counts them on the rules screen. The count is the
        // whole truth (it is what the screen shows next to the rule) and the list
        // is capped, so a huge rule can never make the two disagree again.
        $matched = $this->matchingRecords(
            $this->matchableRecords($userId, $categoryId),
            $this->classifierFor($userId),
            $field,
            $operator,
            $expected,
            $categoryId
        );

        return response()->json([
            'matched' => $matched->count(),
            'records' => $matched->take($max)->values(),
        ]);
    }

    /**
     * The user's movements, ready to be matched in PHP.
     *
     * Loaded once per screen instead of once per rule: the rules screen asks
     * "how many movements does this catch?" for every rule it shows.
     *
     * @return Collection<int,Record>
     */
    private function matchableRecords(int $userId, ?int $categoryId = null): Collection
    {
        return Record::where('user_id', $userId)
            ->when($categoryId, fn ($query, $id) => $query->where('category_id', $id))
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(self::MATCHABLE_LIMIT)
            ->get();
    }

    /**
     * The movements a rule catches: ONE question, ONE place.
     *
     * The number next to a rule and the list that opens when it is clicked come
     * from here, so the two cannot disagree again. They did: the number was
     * `hits`, a running counter that only grew when the importer applied the
     * rule, while the list was counted live ("3 movements" opened 4).
     *
     * The category is part of the question: a rule categorises into one
     * category, so only the movements already in it are counted and listed.
     *
     * @param  Collection<int,Record>  $records  the user's movements, loaded once
     * @return Collection<int,Record>
     */
    private function matchingRecords(
        Collection $records,
        CategoryClassifier $classifier,
        string $field,
        string $operator,
        string $expected,
        ?int $categoryId = null,
        ?int $limit = null
    ): Collection {
        $matched = [];

        foreach ($records as $record) {
            if ($categoryId !== null && (int) $record->category_id !== $categoryId) {
                continue;
            }

            if (! $this->recordMatches($classifier, $record, $field, $operator, $expected)) {
                continue;
            }

            $matched[] = $record;

            if ($limit !== null && count($matched) >= $limit) {
                break;
            }
        }

        return collect($matched);
    }

    /**
     * Does one record match the searched text?
     */
    private function recordMatches(
        CategoryClassifier $classifier,
        Record $record,
        string $field,
        string $operator,
        string $expected
    ): bool {
        $raw = strtoupper((string) ($record->name ?: $record->description));
        $key = (string) ($record->merchant_key ?: $classifier->merchantKey($record->name ?: $record->description));

        if ($field === 'text') {
            return $this->matches($operator, $expected, $raw);
        }

        return $this->matches($operator, $expected, $key)
            || $this->matches($operator, $expected, $raw);
    }

    /**
     * A category is valid when it is the user's own, or when it is one his own
     * data already uses: the default categories shipped with the app belong to
     * a seed user, so they are not his but they are on his own movements.
     */
    private function categoryBelongsToUser(int $userId, int $categoryId): bool
    {
        if (Category::where('id', $categoryId)->where('user_id', $userId)->exists()) {
            return true;
        }

        return Record::where('user_id', $userId)->where('category_id', $categoryId)->exists()
            || CategoryRule::forUser($userId)->where('category_id', $categoryId)->exists();
    }

    /**
     * Categories the user can pick: his own plus the ones already used by his
     * movements. Each one carries the name of its group so the UI can show a
     * plain grouped list.
     *
     * @return array<int,array<string,mixed>>
     */
    private function categoryChoices(int $userId): array
    {
        $ownIds = Category::where('user_id', $userId)->pluck('id')->all();
        $usedIds = Record::where('user_id', $userId)
            ->whereNotNull('category_id')
            ->distinct()
            ->pluck('category_id')
            ->all();

        $ids = array_values(array_unique(array_merge($ownIds, $usedIds)));
        if ($ids === []) {
            return [];
        }

        $categories = Category::whereIn('id', $ids)
            ->orderBy('name')
            ->get(['id', 'name', 'parent_category_id', 'user_id']);

        $parentIds = $categories->pluck('parent_category_id')->filter()->unique()->all();
        $parents = $parentIds === []
            ? []
            : ParentCategory::whereIn('id', $parentIds)->pluck('name', 'id')->all();

        return $categories
            ->map(fn (Category $category) => [
                'id' => $category->id,
                'name' => $category->name,
                'parent_name' => $parents[$category->parent_category_id] ?? 'Other',
                'own' => (int) $category->user_id === $userId,
            ])
            ->values()
            ->all();
    }

    private function validated(Request $request): array
    {
        $data = $request->validate([
            'match_field' => 'nullable|in:' . implode(',', CategoryRule::FIELDS),
            'operator' => 'required|in:' . implode(',', CategoryRule::OPERATORS),
            'value' => 'required|string|max:255',
            'category_id' => 'required|integer',
            'priority' => 'nullable|integer|min:1|max:9999',
            'enabled' => 'nullable|boolean',
        ]);

        $userId = (int) $request->user()->id;
        if (! $this->categoryBelongsToUser($userId, (int) $data['category_id'])) {
            abort(response()->json(['error' => 'Invalid category'], 422));
        }

        return $data;
    }
}
