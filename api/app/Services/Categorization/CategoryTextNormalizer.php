<?php

namespace App\Services\Categorization;

/**
 * Turns a raw bank description into a repeatable merchant key.
 *
 * THIS CLASS IS THE SAFETY GATE OF THE WHOLE FEATURE:
 * when the text carries no merchant information (empty text, only a payment
 * method, only numbers/dates/references) it returns NULL. Callers must treat
 * NULL as "do not categorise" — never as "look for something similar".
 *
 * It never looks at the amount, the date or other movements: only at the text.
 */
class CategoryTextNormalizer
{
    /** @var array<string,mixed> */
    private array $config;

    /** @var array<string,bool>|null */
    private ?array $genericTokenIndex = null;

    /** @var array<string,string>|null */
    private ?array $aliasIndex = null;

    /**
     * Tokens that carry no merchant information FOR THIS USER, worked out from
     * his own movements instead of from a dictionary shipped with the project.
     *
     * @var array<string,bool>
     */
    private array $corpusNoise = [];

    /** @var int */
    private int $corpusDocuments = 0;

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? (array) config('categorization', []);
    }

    /**
     * Read the user's own movements so the key is built from what identifies a
     * merchant, not from the words the bank repeats in every line.
     *
     * A word that shows up in most of the movements on the account ("card
     * payment", "direct debit", the account holder, the city) says nothing
     * about WHO was paid: those words are dropped for this corpus only, and the
     * key survives from the words that do single a merchant out. Nothing is
     * hardcoded per bank: the list is derived from the texts in front of it.
     *
     * @param array<int,string|null> $texts
     */
    public function withCorpus(array $texts): self
    {
        $clone = clone $this;
        $clone->corpusNoise = [];
        $clone->corpusDocuments = 0;

        $minDocuments = max(2, (int) ($this->config['corpus_min_documents'] ?? 8));
        $noiseShare = (float) ($this->config['corpus_noise_share'] ?? 0.4);

        $documents = [];
        foreach ($texts as $raw) {
            $tokens = $this->rawTokensOf($raw);
            if ($tokens !== []) {
                $documents[] = $tokens;
            }
        }

        $total = count($documents);
        if ($total < $minDocuments || $noiseShare <= 0.0) {
            return $clone;
        }

        $seen = [];
        foreach ($documents as $tokens) {
            foreach ($tokens as $token) {
                $seen[$token] = ($seen[$token] ?? 0) + 1;
            }
        }

        $noise = [];
        foreach ($seen as $token => $count) {
            if ($count / $total >= $noiseShare) {
                $noise[$token] = true;
            }
        }

        $clone->corpusDocuments = $total;
        $clone->corpusNoise = $noise;

        return $clone;
    }

    /**
     * How many of the movements fed to withCorpus() were used.
     */
    public function corpusDocuments(): int
    {
        return $this->corpusDocuments;
    }

    /**
     * Every word of a text (cleaned and stripped of dates/references), before
     * the length and generic-word filters: the corpus has to see the words the
     * key would otherwise be built from.
     *
     * @return array<int,string>
     */
    private function rawTokensOf(?string $raw): array
    {
        $text = $this->stripNoise($this->cleanText($raw));
        if ($text === '') {
            return [];
        }

        $tokens = [];
        foreach (explode(' ', $text) as $token) {
            $token = trim($token);
            if ($token !== '' && preg_replace('/[^A-Z]/', '', $token) !== '') {
                $tokens[$token] = true;
            }
        }

        return array_keys($tokens);
    }

    /**
     * Normalise a raw bank text into a merchant key.
     *
     * @return string|null NULL when there is no usable merchant information.
     */
    public function normalize(?string $raw): ?string
    {
        $text = $this->cleanText($raw);
        if ($text === '') {
            return null;
        }

        $text = $this->stripNoise($text);

        $tokens = $this->tokensOf($text);
        if (empty($tokens)) {
            // Empty text, only payment-method words, only numbers: NO KEY.
            return null;
        }

        return $this->buildKey($tokens);
    }

    /**
     * True when the text carries enough information to identify a merchant.
     */
    public function isUsable(?string $raw): bool
    {
        return $this->normalize($raw) !== null;
    }

    /**
     * Significant tokens of a text, for display / debugging purposes.
     *
     * @return array<int,string>
     */
    public function significantTokens(?string $raw): array
    {
        $text = $this->cleanText($raw);
        if ($text === '') {
            return [];
        }

        return $this->tokensOf($this->stripNoise($text));
    }

    /**
     * Uppercase, accent-free, punctuation collapsed to single spaces.
     */
    private function cleanText(?string $raw): string
    {
        if ($raw === null) {
            return '';
        }

        $text = (string) $raw;

        // Remove accents/diacritics: bank files mix both forms of the same word.
        if (function_exists('iconv')) {
            $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $text);
            if ($converted !== false && $converted !== '') {
                $text = $converted;
            }
        }

        $text = strtoupper($text);
        // Any character that is not a letter or a digit becomes a separator.
        $text = preg_replace('/[^A-Z0-9]+/u', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    /**
     * Remove everything that is not the merchant: dates, references, card
     * numbers, terminal ids, masked digits.
     */
    private function stripNoise(string $text): string
    {
        // Dates: 12/03, 12-03-2026, 12.03.26
        $text = preg_replace('/\b\d{1,2}[\/\-\.]\d{1,2}([\/\-\.]\d{2,4})?\b/', ' ', $text) ?? '';
        // Times: 14:32
        $text = preg_replace('/\b\d{1,2}:\d{2}(:\d{2})?\b/', ' ', $text) ?? '';
        // Card / operation references: 434001666169, 0000012345678
        $text = preg_replace('/\b\d{5,}\b/', ' ', $text) ?? '';
        // Masked card numbers: ****1234, XXXX1234, 5678*
        $text = preg_replace('/\b[X\*]{2,}\d{0,4}\b/', ' ', $text) ?? '';
        $text = preg_replace('/\b\d{2,}\*+\b/', ' ', $text) ?? '';
        // Gateway markers: SQ *, SumUp *, SP * (keep the merchant after it)
        $text = preg_replace('/\b(SQ|SUMUP|IZETTLE|STRIPE|SP|WPY|PAYPL)\s*\*\s*/', ' ', $text) ?? '';
        // Years and short numbers (store ids, terminal numbers)
        $text = preg_replace('/\b(19|20)\d{2}\b/', ' ', $text) ?? '';
        $text = preg_replace('/\b\d{2,4}\b/', ' ', $text) ?? '';
        // Leftover single characters
        $text = preg_replace('/\b[A-Z]\b/', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    /**
     * Keep only tokens that can identify a merchant.
     *
     * @return array<int,string>
     */
    private function tokensOf(string $text): array
    {
        $stop = $this->genericTokens();
        $minLength = (int) ($this->config['min_token_length'] ?? 3);

        $tokens = [];
        foreach (explode(' ', $text) as $token) {
            $token = trim($token);
            if ($token === '') {
                continue;
            }
            // Must carry at least 3 letters. Tokens that are mostly digits are
            // references, but real merchant names can contain digits
            // (SHOP24, STORE365), so those must survive.
            $letters = preg_replace('/[^A-Z]/', '', $token);
            if (mb_strlen((string) $letters) < 3) {
                continue;
            }
            if (mb_strlen($token) < $minLength) {
                continue;
            }
            if (isset($stop[$token])) {
                continue;
            }
            $tokens[] = $token;
        }

        // Remove duplicates, preserving order (bank texts repeat the merchant).
        $tokens = array_values(array_unique($tokens));

        if ($this->corpusNoise === []) {
            return $tokens;
        }

        // Words the bank repeats in most of this user's movements are not part
        // of the merchant name. If the filter empties the text (a file that only
        // holds movements of one single merchant), the unfiltered tokens are
        // kept: a key that groups those movements together is still true.
        $kept = array_values(array_filter(
            $tokens,
            fn (string $token): bool => ! isset($this->corpusNoise[$token])
        ));

        return $kept === [] ? $tokens : $kept;
    }

    /**
     * Build the key from the first N significant tokens, applying aliases.
     *
     * @param array<int,string> $tokens
     */
    private function buildKey(array $tokens): string
    {
        $aliases = $this->aliases();
        $maxTokens = max(1, (int) ($this->config['key_tokens'] ?? 2));

        // Try aliases from the longest candidate down: the longest match wins.
        $window = array_slice($tokens, 0, min(count($tokens), $maxTokens + 1));
        for ($take = count($window); $take >= 1; $take--) {
            $candidate = implode(' ', array_slice($window, 0, $take));
            if (isset($aliases[$candidate])) {
                return $aliases[$candidate];
            }
        }

        // No alias: the key is the first N significant tokens.
        return implode(' ', array_slice($tokens, 0, min(count($tokens), $maxTokens)));
    }

    /**
     * Generic tokens indexed for O(1) lookups.
     *
     * @return array<string,bool>
     */
    private function genericTokens(): array
    {
        if ($this->genericTokenIndex !== null) {
            return $this->genericTokenIndex;
        }

        $index = [];
        foreach ((array) ($this->config['generic_tokens'] ?? []) as $token) {
            $index[strtoupper(trim((string) $token))] = true;
        }

        return $this->genericTokenIndex = $index;
    }

    /**
     * @return array<string,string>
     */
    private function aliases(): array
    {
        if ($this->aliasIndex !== null) {
            return $this->aliasIndex;
        }

        $index = [];
        foreach ((array) ($this->config['aliases'] ?? []) as $alias => $value) {
            // Alias keys come from the config already normalised.
            $index[$this->cleanText((string) $alias)] = (string) $value;
        }

        return $this->aliasIndex = $index;
    }
}
