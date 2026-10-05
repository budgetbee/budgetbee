<?php

namespace Tests\Unit;

use App\Services\Categorization\CategoryClassifier;
use ReflectionMethod;
use Tests\TestCase;

/**
 * Invariants of the deterministic categoriser.
 *
 * The vocabulary a bank uses is an installation setting, so the tests set their
 * own here instead of relying on the shipped configuration.
 */
class CategoryClassifierSafetyTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config([
            'categorization.key_tokens' => 2,
            'categorization.min_token_length' => 3,
            'categorization.generic_tokens' => [
                'CARD', 'PURCHASE', 'DIRECT', 'DEBIT', 'MOBILE', 'PAYMENT',
                'TRANSFER', 'BILL', 'CHARGE', 'CREDIT', 'ACCOUNT', 'REF', 'FEE',
                'SALARY', 'INTEREST',
            ],
            'categorization.aliases' => [],
        ]);
    }

    /**
     * Without usable text nothing is returned, not even touching the database.
     * (If it queried the database, these tests would fail on an unmigrated DB.)
     */
    public function test_classify_returns_null_when_there_is_no_usable_text(): void
    {
        $classifier = new CategoryClassifier();

        $unusable = [
            null,
            '',
            'DIRECT DEBIT - . - (DIRECT DEBIT - .)',
            'TRANSFER',
            'BILL',
            '434001666169',
            'FEE CARD CREDIT',
        ];

        foreach ($unusable as $raw) {
            $this->assertNull(
                $classifier->classify(1, $raw),
                'It must return NULL (not a category) for: ' . var_export($raw, true)
            );
        }
    }

    /**
     * The amount is deliberately NOT part of the classifier API: matching a
     * movement by its amount against other movements is exactly the false
     * positive we must never produce. This test locks that in.
     */
    public function test_the_classifier_does_not_accept_an_amount(): void
    {
        $parameters = array_map(
            fn ($parameter) => $parameter->getName(),
            (new ReflectionMethod(CategoryClassifier::class, 'classify'))->getParameters()
        );

        $this->assertSame(
            ['userId', 'rawText'],
            $parameters,
            'The classifier must only receive the user and the text: no amount, no date.'
        );
    }

    /**
     * A merchant key is required to learn anything.
     */
    public function test_no_key_means_no_learning_input(): void
    {
        $classifier = new CategoryClassifier();

        $this->assertNull($classifier->merchantKey(''));
        $this->assertNull($classifier->merchantKey(null));
        $this->assertNull($classifier->merchantKey('DIRECT DEBIT'));
        $this->assertSame(
            'ACME MART',
            $classifier->merchantKey('CARD PURCHASE ACME MART - (434001666169 ACME MART NORTHSIDE)')
        );
    }
}
