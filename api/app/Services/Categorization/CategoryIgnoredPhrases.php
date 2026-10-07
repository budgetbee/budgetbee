<?php

namespace App\Services\Categorization;

use App\Models\CategoryIgnoredPhrase;

/**
 * The words a user has told the categoriser to stop reading.
 *
 * This is the whole "bank vocabulary" of this installation, and it is not
 * shipped with the code: it starts empty and only ever holds what the user
 * marked himself. The way to fill it is the Ignore button of the rules screen:
 * "this is not a merchant" means the wording is not read any more when the
 * merchant key is built, so the words that come after take its place.
 */
class CategoryIgnoredPhrases
{
    /** @var array<int,array<int,string>> */
    private static array $cache = [];

    /**
     * Normalised phrases of a user.
     *
     * @return array<int,string>
     */
    public function forUser(int $userId): array
    {
        if (! isset(self::$cache[$userId])) {
            self::$cache[$userId] = CategoryIgnoredPhrase::query()
                ->where('user_id', $userId)
                ->pluck('phrase')
                ->all();
        }

        return self::$cache[$userId];
    }

    /**
     * Mark a wording as "not a merchant". Returns the stored form.
     */
    public function ignore(int $userId, ?string $phrase): ?string
    {
        $phrase = CategoryTextNormalizer::flatten($phrase);

        if ($phrase === '') {
            return null;
        }

        $row = CategoryIgnoredPhrase::firstOrCreate([
            'user_id' => $userId,
            'phrase' => $phrase,
        ]);

        $this->forget($userId);

        return $row->phrase;
    }

    /**
     * Start reading the wording again. Returns how many rows went.
     */
    public function restore(int $userId, ?string $phrase): int
    {
        $deleted = CategoryIgnoredPhrase::query()
            ->where('user_id', $userId)
            ->where('phrase', CategoryTextNormalizer::flatten($phrase))
            ->delete();

        $this->forget($userId);

        return $deleted;
    }

    public function forget(?int $userId = null): void
    {
        if ($userId === null) {
            self::$cache = [];

            return;
        }

        unset(self::$cache[$userId]);
    }
}
