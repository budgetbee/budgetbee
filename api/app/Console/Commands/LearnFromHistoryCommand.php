<?php

namespace App\Console\Commands;

use App\Models\CategoryCandidate;
use App\Models\Record;
use App\Services\Categorization\CategoryLearner;
use Illuminate\Console\Command;

/**
 * Seed the categoriser evidence from the movements already stored.
 *
 * A fresh install (or a database imported from elsewhere) has all its history
 * but no evidence: the learner only counts what passes through the import or
 * the record form from now on, so nothing is suggested until the user
 * categorises the same merchant three times again. This command reads what is
 * already there and writes the same evidence the learner would have written.
 *
 * Nothing is guessed: only movements that already carry BOTH a merchant key and
 * a category are counted, and the promotion rule is the learner's own one
 * (three confirmations and 80% agreement).
 */
class LearnFromHistoryCommand extends Command
{
    protected $signature = 'categorize:learn-from-history {user : User id or email}';

    protected $description = 'Build the categoriser evidence from the movements already stored for a user';

    public function handle(): int
    {
        $identifier = $this->argument('user');

        $user = is_numeric($identifier)
            ? \App\Models\User::find((int) $identifier)
            : \App\Models\User::where('email', $identifier)->first();

        if (! $user) {
            $this->error('User not found: ' . $identifier);

            return self::FAILURE;
        }

        $rows = Record::query()
            ->where('user_id', $user->id)
            ->whereNotNull('merchant_key')
            ->whereNotNull('category_id')
            ->selectRaw('merchant_key, category_id, COUNT(*) as total')
            ->groupBy('merchant_key', 'category_id')
            ->get();

        if ($rows->isEmpty()) {
            $this->warn('No movements with a merchant key and a category: nothing to learn from.');

            return self::SUCCESS;
        }

        $seeded = 0;
        foreach ($rows as $row) {
            $candidate = CategoryCandidate::firstOrNew([
                'user_id' => $user->id,
                'merchant_key' => $row->merchant_key,
                'category_id' => (int) $row->category_id,
            ]);

            $candidate->confirmations = (int) $row->total;
            $candidate->last_seen_at = now();
            $candidate->save();
            $seeded++;
        }

        $this->info('Evidence written: ' . $seeded . ' merchant/category pairs.');

        $learner = new CategoryLearner();
        $promoted = 0;
        foreach ($rows->pluck('merchant_key')->unique() as $merchantKey) {
            if ($learner->promoteIfReady((int) $user->id, (string) $merchantKey) !== null) {
                $promoted++;
                $this->line('  rule created: ' . $merchantKey);
            }
        }

        $this->info('Rules born from history: ' . $promoted);

        return self::SUCCESS;
    }
}
