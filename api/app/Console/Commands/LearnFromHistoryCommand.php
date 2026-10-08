<?php

namespace App\Console\Commands;

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

        $result = app(CategoryLearner::class)->learnFromHistory((int) $user->id);

        if ($result['pairs'] === 0) {
            $this->warn('No movements with a merchant key and a category: nothing to learn from.');

            return self::SUCCESS;
        }

        $this->info('Evidence written: ' . $result['pairs'] . ' merchant/category pairs.');
        $this->info('Rules born from history: ' . $result['rules']);

        return self::SUCCESS;
    }
}
