<?php

namespace App\Services\Categorization;

use App\Models\Record;

/**
 * Rebuilds the merchant key of movements that are already stored.
 *
 * The key is written on the record when the movement comes in, so anything that
 * makes the key better (a wording the user marked as "not a merchant", a bank
 * wording that used to swallow every shop) leaves what is already stored behind.
 *
 * It rewrites the keys and nothing else: no dates, no amounts, no categories.
 */
class MerchantKeyRebuilder
{
    /**
     * @param array<int,string> $onlyKeys Movements carrying one of these keys (all of them when empty).
     * @return array{scanned:int,changed:int,changes:array<string,int>}
     */
    public function rebuild(int $userId, array $onlyKeys = [], bool $dryRun = false, ?int $accountId = null, ?int $limit = null): array
    {
        $normaliser = app(CategoryCorpus::class)->normalizerFor($userId, $accountId, [], $limit);

        $scanned = 0;
        $changed = 0;
        $changes = [];

        Record::query()
            ->where('user_id', $userId)
            ->when($accountId, fn ($query) => $query->where('from_account_id', $accountId))
            ->when($onlyKeys !== [], fn ($query) => $query->whereIn('merchant_key', $onlyKeys))
            ->orderBy('id')
            ->chunkById(500, function ($records) use ($normaliser, $dryRun, &$scanned, &$changed, &$changes) {
                foreach ($records as $record) {
                    $scanned++;

                    $newKey = $normaliser->normalize($record->name ?: $record->description);

                    if ($newKey === $record->merchant_key) {
                        continue;
                    }

                    $changed++;
                    $label = ((string) $record->merchant_key) . ' => ' . ((string) $newKey);
                    $changes[$label] = ($changes[$label] ?? 0) + 1;

                    if (! $dryRun) {
                        $record->merchant_key = $newKey;
                        $record->saveQuietly();
                    }
                }
            });

        return ['scanned' => $scanned, 'changed' => $changed, 'changes' => $changes];
    }
}
