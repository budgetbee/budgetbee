<?php

namespace App\Console\Commands;

use App\Models\CategoryCandidate;
use App\Models\CategoryRule;
use App\Models\Record;
use App\Models\User;
use App\Services\Categorization\CategoryTextNormalizer;
use Illuminate\Console\Command;

/**
 * Rebuilds the merchant key of movements that are already stored.
 *
 * The key is written on the record when the movement comes in. When the way the
 * key is built gets better (a bank wording that used to become the key and
 * swallowed every shop), the movements already in the database keep the old key
 * for ever, and so does everything the categoriser learned from them.
 *
 * This command reads the user's own movements, works out again which words
 * identify nobody, and rewrites the key. It changes no dates, no amounts and no
 * categories: only `merchant_key` and, with --prune, the learned evidence whose
 * key no longer exists.
 */
class RefreshMerchantKeysCommand extends Command
{
    protected $signature = 'categorization:refresh-keys
                            {--user= : Only this user id (all users with movements by default)}
                            {--account= : Only movements of this account}
                            {--limit=2000 : How many movements are read as evidence}
                            {--dry-run : Show what would change, write nothing}
                            {--prune : Delete learned candidates whose key no longer exists and disable the rules built on them}';

    protected $description = 'Rebuild the merchant key of stored movements with the current rules';

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');
        $limit = max(50, (int) $this->option('limit'));
        $accountId = $this->option('account') !== null ? (int) $this->option('account') : null;

        $userIds = $this->option('user') !== null
            ? [(int) $this->option('user')]
            : User::query()->whereIn('id', Record::query()->select('user_id')->distinct())->pluck('id')->all();

        if ($userIds === []) {
            $this->info('No movements to look at.');

            return self::SUCCESS;
        }

        $totals = ['scanned' => 0, 'changed' => 0, 'pruned' => 0, 'rules' => 0];

        foreach ($userIds as $userId) {
            $normalizer = $this->normalizerFor((int) $userId, $accountId, $limit);

            $this->line(sprintf(
                'User %d: %d movements as evidence',
                $userId,
                (int) Record::query()->where('user_id', $userId)->count()
            ));

            $changes = [];

            Record::query()
                ->where('user_id', $userId)
                ->when($accountId, fn ($query) => $query->where('from_account_id', $accountId))
                ->orderBy('id')
                ->chunkById(500, function ($records) use ($normalizer, $dryRun, &$totals, &$changes) {
                    foreach ($records as $record) {
                        $totals['scanned']++;

                        $newKey = $normalizer->normalize($record->name ?: $record->description);

                        if ($newKey === $record->merchant_key) {
                            continue;
                        }

                        $totals['changed']++;
                        $changes[$record->merchant_key . ' => ' . $newKey] = ($changes[$record->merchant_key . ' => ' . $newKey] ?? 0) + 1;

                        if (! $dryRun) {
                            $record->merchant_key = $newKey;
                            $record->saveQuietly();
                        }
                    }
                });

            foreach ($changes as $change => $count) {
                $this->line(sprintf('  %s  (%d)', $change, $count));
            }

            if ($changes === []) {
                $this->line('  Nothing to change: the keys already match.');
            }

            if ($this->option('prune')) {
                $pruned = $this->prune((int) $userId, $dryRun);
                $totals['pruned'] += $pruned['candidates'];
                $totals['rules'] += $pruned['rules'];

                $this->line(sprintf(
                    '  %s %d learned candidates and %d learned rules whose key no longer exists',
                    $dryRun ? 'Would remove' : 'Removed',
                    $pruned['candidates'],
                    $pruned['rules']
                ));
            }
        }

        $this->newLine();
        $this->info(sprintf(
            '%s%d movements read, %d keys rewritten%s',
            $dryRun ? '[dry run] ' : '',
            $totals['scanned'],
            $totals['changed'],
            $dryRun ? ' (nothing written)' : ''
        ));

        return self::SUCCESS;
    }

    /**
     * The normaliser of a user: his movements are the evidence of what a bank
     * repeats in every line, so nothing has to be listed per bank.
     */
    private function normalizerFor(int $userId, ?int $accountId, int $limit): CategoryTextNormalizer
    {
        $texts = Record::query()
            ->where('user_id', $userId)
            ->when($accountId, fn ($query) => $query->where('from_account_id', $accountId))
            ->orderByDesc('id')
            ->limit($limit)
            ->get(['name', 'description']);

        $corpus = [];
        foreach ($texts as $row) {
            $text = trim((string) ($row->name ?: $row->description));
            if ($text !== '') {
                $corpus[] = $text;
            }
        }

        return (new CategoryTextNormalizer())->withCorpus($corpus);
    }

    /**
     * Learned evidence whose key does not match any stored movement any more is
     * evidence about a key that no longer exists: it can only produce rules that
     * group movements that have nothing to do with each other.
     *
     * @return array{candidates:int,rules:int}
     */
    private function prune(int $userId, bool $dryRun): array
    {
        $keys = Record::query()
            ->where('user_id', $userId)
            ->whereNotNull('merchant_key')
            ->distinct()
            ->pluck('merchant_key')
            ->all();

        $candidates = CategoryCandidate::query()->where('user_id', $userId)->whereNotIn('merchant_key', $keys);
        $rules = CategoryRule::query()
            ->where('user_id', $userId)
            ->where('match_field', 'merchant_key')
            ->where('source', CategoryRule::SOURCE_LEARNED)
            ->whereNotIn('value', $keys);

        $counts = ['candidates' => (clone $candidates)->count(), 'rules' => (clone $rules)->count()];

        if ($dryRun) {
            return $counts;
        }

        $counts['rules'] = $rules->update(['enabled' => false]);
        $candidates->delete();

        return $counts;
    }
}
