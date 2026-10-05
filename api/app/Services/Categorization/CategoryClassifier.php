<?php

namespace App\Services\Categorization;

use App\Models\CategoryRule;
use App\Models\Record;

/**
 * Deterministic categoriser.
 *
 * Order of resolution:
 *   1. manual rule        (source: rule)
 *   2. learned rule       (source: learned)
 *   3. history of the same merchant key (source: history)
 *   4. nothing -> NULL    (the movement stays unknown and goes to review)
 *
 * SAFETY RULES (do not break these):
 *   - The amount is NOT a parameter of this service. It cannot be used to
 *     match movements, by design.
 *   - If the text has no usable merchant information, classify() returns NULL
 *     before looking at anything else.
 *   - Two different merchant keys never match each other.
 */
class CategoryClassifier
{
    private CategoryTextNormalizer $normalizer;

    /** @var array<string,mixed> */
    private array $config;

    public function __construct(?CategoryTextNormalizer $normalizer = null, ?array $config = null)
    {
        $this->normalizer = $normalizer ?? new CategoryTextNormalizer();
        $this->config = $config ?? (array) config('categorization', []);
    }

    public function normalizer(): CategoryTextNormalizer
    {
        return $this->normalizer;
    }

    /**
     * Classify a movement using ONLY the user's rules: the ones he wrote and the
     * ones the categoriser learned. No history, no guessing.
     *
     * Used by the record form, which suggests a category from the rules while he
     * types the concept.
     *
     * @return array{category_id:int,source:string,confidence:float,merchant_key:string}|null
     *         NULL means "no rule knows this": the caller must not invent anything.
     */
    public function classifyByRules(int $userId, ?string $rawText): ?array
    {
        $raw = strtoupper(trim((string) $rawText));
        $merchantKey = $this->normalizer->normalize($rawText);

        // A rule written by the user on the movement TEXT is an explicit
        // instruction ("whenever LAURA appears it is a subscription"), so it is
        // honoured even when the text has nothing else to learn from.
        $textRule = $this->findRule($userId, $raw, 'text');
        if ($textRule !== null) {
            return [
                'category_id' => (int) $textRule->category_id,
                'source' => 'rule',
                'confidence' => 1.0,
                'merchant_key' => $merchantKey,
            ];
        }

        if ($merchantKey === null) {
            return null;
        }

        $rule = $this->findRule($userId, $merchantKey, 'merchant_key');
        if ($rule === null) {
            return null;
        }

        return [
            'category_id' => (int) $rule->category_id,
            'source' => $rule->source === 'manual' ? 'rule' : 'learned',
            'confidence' => $rule->source === 'manual' ? 1.0 : 0.9,
            'merchant_key' => $merchantKey,
        ];
    }

    /**
     * Classify a movement from its raw bank text.
     *
     * Rules first, and when no rule knows the merchant, what the user's own
     * movements say (history).
     *
     * @return array{category_id:int,source:string,confidence:float,merchant_key:string}|null
     *         NULL means "nothing is known": the caller must not invent a category.
     */
    public function classify(int $userId, ?string $rawText): ?array
    {
        $byRules = $this->classifyByRules($userId, $rawText);

        if ($byRules !== null) {
            return $byRules;
        }

        $merchantKey = $this->normalizer->normalize($rawText);

        if ($merchantKey === null) {
            // No usable text: never guess, never look for something similar.
            return null;
        }

        $history = $this->fromHistory($userId, $merchantKey);
        if ($history !== null) {
            return [
                'category_id' => (int) $history['category_id'],
                'source' => 'history',
                'confidence' => round((float) $history['share'], 3),
                'merchant_key' => $merchantKey,
            ];
        }

        // Known merchant, but no consistent evidence yet: leave it unknown.
        return null;
    }

    /**
     * Merchant key of a text, or NULL when there is nothing to learn from.
     */
    public function merchantKey(?string $rawText): ?string
    {
        return $this->normalizer->normalize($rawText);
    }

    /**
     * First enabled rule matching the subject: manual rules always win over
     * learned ones, then priority, then most specific operator.
     */
    private function findRule(int $userId, string $subject, string $field = 'merchant_key'): ?CategoryRule
    {
        $rules = CategoryRule::query()
            ->where('user_id', $userId)
            ->where('enabled', true)
            ->where('match_field', $field)
            ->orderByRaw("FIELD(source, 'manual', 'learned', 'ai')")
            ->orderBy('priority')
            ->orderByRaw("FIELD(`operator`, 'equals', 'starts_with', 'contains', 'regex')")
            ->get();

        foreach ($rules as $rule) {
            if ($this->ruleMatches($rule, $subject)) {
                return $rule;
            }
        }

        return null;
    }

    private function ruleMatches(CategoryRule $rule, string $subject): bool
    {
        $value = strtoupper(trim((string) $rule->value));
        if ($value === '') {
            return false;
        }

        return match ($rule->operator) {
            'equals' => $subject === $value,
            'starts_with' => str_starts_with($subject, $value),
            'contains' => str_contains($subject, $value),
            'regex' => $this->safeRegex($value, $subject),
            default => false,
        };
    }

    /**
     * Regex rules are user input: a broken pattern must never blow up an import.
     */
    private function safeRegex(string $pattern, string $subject): bool
    {
        $delimited = '/' . str_replace('/', '\/', $pattern) . '/u';
        $result = @preg_match($delimited, $subject);

        return $result === 1;
    }

    /**
     * Existing records of the same merchant key, when they agree clearly.
     *
     * @return array{category_id:int,share:float,samples:int}|null
     */
    private function fromHistory(int $userId, string $merchantKey): ?array
    {
        $rows = Record::query()
            ->where('user_id', $userId)
            ->where('merchant_key', $merchantKey)
            ->whereNotNull('category_id')
            ->selectRaw('category_id, COUNT(*) as total')
            ->groupBy('category_id')
            ->orderByDesc('total')
            ->get();

        if ($rows->isEmpty()) {
            return null;
        }

        $samples = (int) $rows->sum('total');
        $minSamples = (int) ($this->config['history_min_samples'] ?? 3);
        $minShare = (float) ($this->config['history_min_share'] ?? 0.8);

        if ($samples < $minSamples) {
            return null;
        }

        $top = $rows->first();
        $share = $samples > 0 ? ((int) $top->total) / $samples : 0.0;

        if ($share < $minShare) {
            return null;
        }

        return [
            'category_id' => (int) $top->category_id,
            'share' => $share,
            'samples' => $samples,
        ];
    }
}
