<?php

namespace App\Services\Categorization;

use App\Models\CategoryCandidate;
use App\Models\CategoryRule;
use App\Models\Record;

/**
 * Learns from the user's own confirmations.
 *
 * Rules:
 *   - Nothing is learned without a merchant key (no key = no evidence).
 *   - A single event never creates a rule: it needs `min_confirmations`
 *     confirmations AND `min_share` of the evidence for that key.
 *   - A correction does not modify existing rules: it adds a contradiction to
 *     the category that was replaced and a confirmation to the new one.
 *   - AI answers are never auto-promoted (they arrive as candidates and need
 *     the same confirmations as anything else).
 */
class CategoryLearner
{
    /** @var array<string,mixed> */
    private array $config;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? (array) config('categorization', []);
    }

    /**
     * Register that a merchant key was (or is being) categorised.
     *
     * @param int      $userId        Owner of the records.
     * @param string|null $merchantKey Normalised merchant key, NULL when the text was unusable.
     * @param int|null $categoryId    Category that was used.
     * @param int|null $replacedCategoryId Category that was replaced, when the user corrected a suggestion.
     */
    public function confirm(int $userId, ?string $merchantKey, ?int $categoryId, ?int $replacedCategoryId = null): void
    {
        if ($merchantKey === null || $merchantKey === '' || $categoryId === null) {
            return;
        }

        if ($replacedCategoryId !== null && $replacedCategoryId !== $categoryId) {
            $this->addContradiction($userId, $merchantKey, $replacedCategoryId);
        }

        $candidate = CategoryCandidate::firstOrNew([
            'user_id' => $userId,
            'merchant_key' => $merchantKey,
            'category_id' => $categoryId,
        ]);

        $candidate->confirmations = (int) $candidate->confirmations + 1;
        $candidate->last_seen_at = now();
        $candidate->save();

        $this->promoteIfReady($userId, $merchantKey);
    }

    /**
     * Write the evidence that is already in the stored movements.
     *
     * The learner only counts what passes through the import or the record form
     * from now on, so a database that already had history suggests nothing until
     * it is read once. This reads what is there and writes the same evidence the
     * learner would have written, with the same promotion rule. Only movements
     * carrying BOTH a merchant key and a category count: nothing is guessed.
     *
     * @return array{pairs:int,rules:int}
     */
    public function learnFromHistory(int $userId): array
    {
        $rows = Record::query()
            ->where('user_id', $userId)
            ->whereNotNull('merchant_key')
            ->where('merchant_key', '<>', '')
            ->whereNotNull('category_id')
            ->selectRaw('merchant_key, category_id, COUNT(*) as total')
            ->groupBy('merchant_key', 'category_id')
            ->get();

        if ($rows->isEmpty()) {
            return ['pairs' => 0, 'rules' => 0];
        }

        $pairs = 0;
        foreach ($rows as $row) {
            $candidate = CategoryCandidate::firstOrNew([
                'user_id' => $userId,
                'merchant_key' => $row->merchant_key,
                'category_id' => (int) $row->category_id,
            ]);

            $candidate->confirmations = (int) $row->total;
            $candidate->last_seen_at = now();
            $candidate->save();
            $pairs++;
        }

        $rules = 0;
        foreach ($rows->pluck('merchant_key')->unique() as $merchantKey) {
            if ($this->promoteIfReady($userId, (string) $merchantKey) !== null) {
                $rules++;
            }
        }

        return ['pairs' => $pairs, 'rules' => $rules];
    }

    /**
     * Promote a candidate to a rule when the evidence is clear enough.
     */
    public function promoteIfReady(int $userId, string $merchantKey): ?CategoryRule
    {
        $existing = CategoryRule::forUser($userId)
            ->where('match_field', 'merchant_key')
            ->where('value', $merchantKey)
            ->first();

        if ($existing !== null) {
            if ($existing->source === CategoryRule::SOURCE_LEARNED) {
                // Keep the hit count meaningful, but never change the category
                // on its own: only the user (or an explicit correction flow) does.
                $existing->hits = (int) $existing->hits;
                $existing->save();
            }

            return null;
        }

        $candidates = CategoryCandidate::forUser($userId)
            ->where('merchant_key', $merchantKey)
            ->get();

        if ($candidates->isEmpty()) {
            return null;
        }

        // The user ignored this merchant on the screen: it is not learned on
        // its own either. He said no, and that stands.
        if ($candidates->contains(fn (CategoryCandidate $candidate) => $candidate->ignored_at !== null)) {
            return null;
        }

        $total = (int) $candidates->sum('confirmations');
        if ($total <= 0) {
            return null;
        }

        $top = $candidates->sortByDesc('confirmations')->first();
        $confirmations = (int) $top->confirmations;

        // The fallback category is where the app puts what it does not know, so
        // a wording filed there over and over says nothing about the merchant.
        // It stays as a suggestion for the user to answer (or ignore): it never
        // becomes a rule pointing at "Desconocido" on its own.
        if ((int) $top->category_id === app(FallbackCategory::class)->idFor($userId)) {
            return null;
        }

        $minConfirmations = (int) ($this->config['min_confirmations'] ?? 3);
        $minShare = (float) ($this->config['min_share'] ?? 0.8);

        if ($confirmations < $minConfirmations) {
            return null;
        }

        if (($confirmations / $total) < $minShare) {
            return null;
        }

        $rule = CategoryRule::create([
            'user_id' => $userId,
            'match_field' => 'merchant_key',
            'operator' => 'equals',
            'value' => $merchantKey,
            'category_id' => (int) $top->category_id,
            'priority' => 100,
            'source' => CategoryRule::SOURCE_LEARNED,
            'hits' => $confirmations,
            'last_hit_at' => now(),
            'enabled' => true,
        ]);

        return $rule;
    }

    private function addContradiction(int $userId, string $merchantKey, int $categoryId): void
    {
        if ($categoryId <= 0) {
            return;
        }

        $candidate = CategoryCandidate::firstOrNew([
            'user_id' => $userId,
            'merchant_key' => $merchantKey,
            'category_id' => $categoryId,
        ]);

        $candidate->contradictions = (int) $candidate->contradictions + 1;
        $candidate->last_seen_at = now();
        $candidate->save();
    }
}
