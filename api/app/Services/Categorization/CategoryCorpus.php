<?php

namespace App\Services\Categorization;

use App\Models\Record;

/**
 * The movements a merchant key is built against.
 *
 * This project ships no bank dictionary on purpose: the words that repeat in a
 * bank's lines are a property of the user's bank, not of this code, and a list
 * shipped here would either be wrong for everybody else or would quietly merge
 * merchants that have nothing to do with each other.
 *
 * So the normaliser is handed the user's own texts instead — the file being
 * imported plus the movements already stored — and works out from them which
 * words identify nobody ("card payment", the account holder, the city). Nothing
 * is blacklisted by hand: a word stops being part of the key because it shows up
 * in most of his own movements, whatever the bank calls it.
 */
class CategoryCorpus
{
    /**
     * Texts to build a key against: the batch in hand first, then the movements
     * already on the account or on the user's whole history.
     *
     * @param array<int,string|null> $extra Texts of the batch being processed.
     * @return array<int,string>
     */
    public function textsFor(int $userId, ?int $accountId = null, array $extra = [], ?int $limit = null): array
    {
        $config = (array) config('categorization', []);
        $limit = $limit ?? max(20, (int) ($config['corpus_history_rows'] ?? 300));

        $texts = [];

        foreach ($extra as $text) {
            $text = trim((string) $text);
            if ($text !== '') {
                $texts[] = $text;
            }
        }

        $rows = Record::query()
            ->where('user_id', $userId)
            ->when($accountId, function ($query) use ($accountId) {
                $query->where(function ($where) use ($accountId) {
                    $where->where('from_account_id', $accountId)
                        ->orWhere('to_account_id', $accountId);
                });
            })
            ->orderByDesc('id')
            ->limit($limit)
            ->get(['name', 'description']);

        foreach ($rows as $row) {
            $text = trim((string) ($row->name ?: $row->description));
            if ($text !== '') {
                $texts[] = $text;
            }
        }

        return $texts;
    }

    /**
     * A normaliser ready for this user: same API, minus the words his bank
     * repeats in every line.
     */
    public function normalizerFor(int $userId, ?int $accountId = null, array $extra = [], ?int $limit = null): CategoryTextNormalizer
    {
        return (new CategoryTextNormalizer())
            ->withCorpus($this->textsFor($userId, $accountId, $extra, $limit));
    }
}
