<?php

namespace Tests\Unit;

use App\Services\Categorization\CategoryTextNormalizer;
use Tests\TestCase;

/**
 * The safety gate of auto-categorisation.
 *
 * If these tests pass, a movement without usable merchant text CANNOT be
 * categorised by similarity: it produces no key at all.
 *
 * The bank texts here are made up on purpose. The words a bank wraps around the
 * merchant name are a property of the installation (see config/categorization
 * .php), so the test brings its own list instead of shipping one.
 */
class CategoryTextNormalizerTest extends TestCase
{
    private CategoryTextNormalizer $normalizer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->normalizer = new CategoryTextNormalizer([
            'key_tokens' => 2,
            'min_token_length' => 3,
            'generic_tokens' => [
                'CARD', 'PURCHASE', 'DIRECT', 'DEBIT', 'MOBILE', 'PAYMENT',
                'TRANSFER', 'FROM', 'BILL', 'CHARGE', 'CREDIT', 'ACCOUNT', 'REF',
                'DEPOSIT', 'WITHDRAWAL', 'INTEREST', 'FEE', 'SALARY', 'LOAN',
                'SETTLEMENT', 'STATEMENT', 'BALANCE', 'CASH',
            ],
            'aliases' => [
                'ACMEMKT' => 'ACME MART',
                'ACME MKTPLACE' => 'ACME MART',
                'NWPOWER' => 'NORTHWIND POWER',
            ],
        ]);
    }

    /**
     * A bank line ends up as the merchant, and only the merchant.
     */
    public function test_bank_texts_produce_the_expected_key(): void
    {
        $cases = [
            'ACME MART - (434001666169 ACME MART NORTHSIDE)' => 'ACME MART',
            'CARD PURCHASE 4891 ACME MART' => 'ACME MART',
            'ACME MART NORTHSIDE - (MOBILE PAYMENT 14:32)' => 'ACME MART',
            'ACMEMKT 22/09/2026' => 'ACME MART',
            'ACME MKTPLACE - (434001666169 ACME MART)' => 'ACME MART',
            'NORTHWIND POWER CO - (DIRECT DEBIT 0000123456)' => 'NORTHWIND POWER',
            'NWPOWER DIRECT DEBIT' => 'NORTHWIND POWER',
            'CONTOSO TELECOM' => 'CONTOSO TELECOM',
            'EXAMPLE STORE 42' => 'EXAMPLE STORE',
        ];

        foreach ($cases as $raw => $expected) {
            $this->assertSame(
                $expected,
                $this->normalizer->normalize((string) $raw),
                'Unexpected key for: ' . $raw
            );
        }
    }

    /**
     * The same merchant must collapse into ONE key, whatever the reference,
     * the date, the time or the branch are.
     */
    public function test_variants_of_the_same_merchant_share_one_key(): void
    {
        $variants = [
            'ACME MART - (434001666169 ACME MART NORTHSIDE)',
            'ACME MART NORTHSIDE - (DIRECT DEBIT 0000123456)',
            'CARD PURCHASE 4891 ACME MART',
            'ACME MART NORTHSIDE - (MOBILE PAYMENT 14:32)',
            'ACMEMKT - (434001666169 ACME MART)',
        ];

        $keys = array_map(fn ($raw) => $this->normalizer->normalize($raw), $variants);

        $this->assertCount(
            1,
            array_unique($keys),
            'All variants must share one key, got: ' . json_encode($keys)
        );
        $this->assertSame('ACME MART', $keys[0]);
    }

    /**
     * THE IMPORTANT ONE.
     *
     * No merchant information -> no key. Empty texts, payment-method words,
     * references and numbers must never be matched against anything.
     */
    public function test_texts_without_merchant_information_produce_no_key(): void
    {
        $unusable = [
            null,
            '',
            '   ',
            '-',
            '.',
            'DIRECT DEBIT - . - (DIRECT DEBIT - .)',
            'DIRECT DEBIT - XX - (CREDIT DIRECT DEBIT - XX)',
            'DIRECT DEBIT',
            'MOBILE PAYMENT',
            'TRANSFER',
            'TRANSFER FROM ACCOUNT',
            'BILL',
            'CHARGE',
            'CREDIT',
            'SALARY',
            'CARD PURCHASE',
            'CARD PURCHASE 1234',
            '434001666169',
            '0000012345678',
            '12/03/2026',
            'FEE CARD CREDIT',
            'INTEREST ACCOUNT',
            'CHARGE FEE INTEREST',
            'CARD ****1234',
            'XX',
            'A',
        ];

        foreach ($unusable as $raw) {
            $this->assertNull(
                $this->normalizer->normalize($raw),
                'This text must produce NO key: ' . var_export($raw, true)
            );
            $this->assertFalse(
                $this->normalizer->isUsable($raw),
                'This text must not be considered usable: ' . var_export($raw, true)
            );
        }
    }

    /**
     * A key made of generic words only would merge unrelated movements.
     */
    public function test_generic_only_texts_do_not_collide(): void
    {
        $a = $this->normalizer->normalize('DIRECT DEBIT 20');
        $b = $this->normalizer->normalize('DIRECT DEBIT 350');

        $this->assertNull($a);
        $this->assertNull($b);
    }

    /**
     * Two threads must not share the dictionaries of the first one to run.
     */
    public function test_the_dictionary_is_not_shared_between_instances(): void
    {
        $one = new CategoryTextNormalizer(['generic_tokens' => ['CARD']]);
        $two = new CategoryTextNormalizer(['generic_tokens' => ['PURCHASE']]);

        $this->assertNull($one->normalize('CARD'), 'CARD is noise for the first instance');
        $this->assertSame('PURCHASE', $one->normalize('PURCHASE 1234'), 'PURCHASE is a merchant for the first instance');
        $this->assertNull($two->normalize('PURCHASE'), 'PURCHASE is noise for the second instance');
        $this->assertSame('CARD', $two->normalize('CARD 1234'), 'CARD is a merchant for the second instance');
    }
}
