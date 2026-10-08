<?php

namespace App\Console\Commands;

use App\Models\CategoryCandidate;
use App\Models\CategoryRule;
use App\Models\Record;
use App\Models\User;
use App\Services\Categorization\MerchantKeyRebuilder;
use Illuminate\Console\Command;

/**
 * Rebuilds the merchant key of movements that are already stored.
 *
 * The key is written on the record when the movement comes in, so anything that
 * makes the key better (a wording the user marked as "not a merchant", a bank
 * wording that used to swallow every shop) leaves what is already stored behind,
 * and everything the categoriser learned from it.
 *
 * This command rewrites the key. It changes no dates, no amounts and no
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

    public function handle(MerchantKeyRebuilder $rebuilder): int
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

        $scanned = 0;
        $changed = 0;
        $pruned = 0;
        $disabled = 0;

        foreach ($userIds as $userId) {
            $userId = (int) $userId;

            $this->line(sprintf(
                'User %d: %d movements as evidence',
                $userId,
                (int) Record::query()->where('user_id', $userId)->count()
            ));

            $result = $rebuilder->rebuild($userId, [], $dryRun, $accountId, $limit);

            $scanned += $result['scanned'];
            $changed += $result['changed'];

            foreach ($result['changes'] as $change => $count) {
                $this->line(sprintf('  %s  (%d)', $change, $count));
            }

            if ($result['changes'] === []) {
                $this->line('  Nothing to change: the keys already match.');
            }

            if ($this->option('prune')) {
                $counts = $this->prune($userId, $dryRun);
                $pruned += $counts['candidates'];
                $disabled += $counts['rules'];

                $this->line(sprintf(
                    '  %s %d learned candidates and %d learned rules whose key no longer exists',
                    $dryRun ? 'Would remove' : 'Removed',
                    $counts['candidates'],
                    $counts['rules']
                ));
            }
        }

        $this->newLine();
        $this->info(sprintf(
            '%s%d movements read, %d keys rewritten%s',
            $dryRun ? '[dry run] ' : '',
            $scanned,
            $changed,
            $dryRun ? ' (nothing written)' : ''
        ));

        if ($this->option('prune')) {
            $this->line(sprintf('Learned evidence: %d candidates removed, %d rules disabled', $pruned, $disabled));
        }

        return self::SUCCESS;
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
