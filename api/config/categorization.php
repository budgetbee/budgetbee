<?php

/**
 * Deterministic auto-categorisation.
 *
 * The whole point of this file: when a movement has no usable merchant text,
 * the categoriser must DO NOTHING. Guessing from an empty description, or
 * matching on the amount alone, produces false positives and is worse than
 * leaving the movement as "unknown".
 */

/*
|--------------------------------------------------------------------------
| The words and the aliases of a bank come from the environment
|--------------------------------------------------------------------------
|
| Every bank wraps the merchant name in its own words ("card purchase",
| "direct debit", the account holder, references) and in its own language:
| that is a property of the installation, not of this project. Shipping one
| country's dictionary would be wrong for everybody else and would merge
| merchants that have nothing to do with each other, so the list starts empty
| and each installation brings its own:
|
|   CATEGORIZATION_GENERIC_TOKENS="CARD,PURCHASE,DIRECT,DEBIT,REF"
|   CATEGORIZATION_ALIASES="LONGFORM SHOP NAME=SHOP,SHOP CARD=SHOP"
|
| With no list at all the categoriser still works: it keeps whatever words the
| text has, which is why it never invents a merchant out of an amount.
|
*/

/** Comma separated list from the environment. */
$envList = static function (string $key): array {
    $raw = (string) env($key, '');
    if (trim($raw) === '') {
        return [];
    }

    return array_values(array_filter(array_map('trim', explode(',', $raw)), static fn ($v) => $v !== ''));
};

/** Comma separated "FROM=TO" pairs from the environment. */
$envMap = static function (string $key): array {
    $out = [];
    foreach (explode(',', (string) env($key, '')) as $pair) {
        if (!str_contains($pair, '=')) {
            continue;
        }
        [$from, $to] = array_map('trim', explode('=', $pair, 2));
        if ($from !== '' && $to !== '') {
            $out[strtoupper($from)] = $to;
        }
    }

    return $out;
};

return [

    /*
    |--------------------------------------------------------------------------
    | Thresholds to promote a learned rule
    |--------------------------------------------------------------------------
    |
    | A rule is only born from repeated evidence: the same merchant key, the
    | same category, at least `min_confirmations` times and at least `min_share`
    | of the evidence for that key. One correction never creates a rule.
    |
    */
    'min_confirmations' => 3,
    'min_share' => 0.8,

    /*
    |--------------------------------------------------------------------------
    | When a merchant is worth suggesting on screen
    |--------------------------------------------------------------------------
    |
    | The screen only shows a suggested rule once the merchant has been seen
    | at least this many times. Two sightings are a coincidence, not a
    | pattern, and a list of coincidences is noise.
    |
    */
    'suggest_min_confirmations' => 3,

    /*
    |--------------------------------------------------------------------------
    | History matching
    |--------------------------------------------------------------------------
    |
    | When there is no rule, the existing records of the same merchant key can
    | be used as evidence, under the same conservative conditions.
    |
    */
    'history_min_samples' => 3,
    'history_min_share' => 0.8,

    /*
    |--------------------------------------------------------------------------
    | Key building
    |--------------------------------------------------------------------------
    */
    // How many significant tokens make up a merchant key.
    'key_tokens' => 2,
    // Tokens shorter than this are dropped (they are usually noise: "XX", "ES").
    'min_token_length' => 3,

    /*
    |--------------------------------------------------------------------------
    | Words that identify nobody, worked out from the user's own movements
    |--------------------------------------------------------------------------
    |
    | A bank wraps every line in its own words ("card payment", "direct debit",
    | the account holder, the city). Those words are not the merchant, and taking
    | the first words of the text as the key makes every shop share one key.
    |
    | They are NOT listed here: the normaliser reads the texts of the file being
    | imported plus the movements already stored, and drops any word that shows
    | up in at least `corpus_noise_share` of them. With fewer than
    | `corpus_min_documents` texts nothing is dropped, so a small file behaves
    | exactly as before.
    |
    */
    'corpus_min_documents' => 8,
    'corpus_noise_share' => 0.4,
    // How many of the user's movements are read as corpus for a single movement.
    'corpus_history_rows' => 300,

    /*
    |--------------------------------------------------------------------------
    | Generic tokens: payment method / banking noise, NOT merchants
    |--------------------------------------------------------------------------
    |
    | If a description is made ONLY of these tokens (plus numbers and dates)
    | there is no merchant to learn from and the categoriser returns nothing.
    | Empty by default: see the note at the top of this file. A merchant family
    | must never be listed here either ("supermarket" collapses different shops
    | into one key and produces false positives).
    |
    */
    'generic_tokens' => $envList('CATEGORIZATION_GENERIC_TOKENS'),

    /*
    |--------------------------------------------------------------------------
    | Alias dictionary
    |--------------------------------------------------------------------------
    |
    | Maps a normalised prefix of the bank text to a canonical merchant key,
    | longest match wins. Empty by default for the same reason: the shops are
    | the user's, not the project's. It grows with the user's confirmations.
    |
    */
    'aliases' => $envMap('CATEGORIZATION_ALIASES'),

];
