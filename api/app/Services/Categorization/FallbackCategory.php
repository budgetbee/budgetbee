<?php

namespace App\Services\Categorization;

use App\Models\Category;

/**
 * The category that catches everything the app does not know ("Desconocido").
 *
 * It has to be recognisable from anywhere that needs to tell a real decision
 * apart from a default: nothing the app files there on its own is worth learning
 * as a rule, and nothing about it says anything about a merchant.
 */
class FallbackCategory
{
    /**
     * @return int|null Category id, or NULL when the installation has none.
     */
    public function idFor(int $userId): ?int
    {
        $names = ['Desconocido', 'Unknown', 'Uncategorised', 'Uncategorized'];

        return Category::where('user_id', $userId)->whereIn('name', $names)->value('id')
            ?? Category::whereIn('name', $names)->value('id')
            ?? Category::where('user_id', $userId)->min('id');
    }
}
