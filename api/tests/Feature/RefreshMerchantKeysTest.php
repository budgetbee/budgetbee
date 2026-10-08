<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Record;
use App\Models\CategoryRule;
use App\Models\CategoryCandidate;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * Movements stored before the key was built properly keep the old key for ever,
 * and everything the categoriser learned from them points at a key that does not
 * exist any more: that is how every shop ends up under one single group.
 *
 * This command rewrites the key of what is already stored — and nothing else.
 *
 * The texts are made up: real exports are nobody's business in a test file.
 */
class RefreshMerchantKeysTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);
        $this->actingAs($this->user);

        $this->userCurrency = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'currency_id' => $this->userCurrency->id,
        ]);
    }

    public function tearDown(): void
    {
        Record::where('user_id', $this->user->id)->delete();
        CategoryCandidate::where('user_id', $this->user->id)->delete();
        CategoryRule::where('user_id', $this->user->id)->delete();
        $this->account->delete();
        $this->userCurrency->delete();
        $this->user->delete();

        parent::tearDown();
    }

    private function importNineMovements(): void
    {
        $rows = [
            'ZZZ MOBILE EN CORNER SHOP',
            'ZZZ MOBILE EN GAS STATION ONE',
            'ZZZ MOBILE EN CORNER SHOP',
            'ZZZ MOBILE EN MRS SMITH',
            'ZZZ MOBILE EN HARDWARE DEPOT',
            'ZZZ MOBILE EN GAS STATION ONE',
            'ZZZ MOBILE EN MRS SMITH',
            'ZZZ MOBILE EN HARDWARE DEPOT',
            'ZZZ MOBILE EN CORNER SHOP',
        ];

        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";
        $day = 1;
        foreach ($rows as $name) {
            $csv .= sprintf("2026-09-%02d,%d,,expense,,%s,10.00,1\n", $day++, $this->account->id, $name);
        }

        Storage::fake('uploads');

        $this->post('/api/import', [
            'file' => UploadedFile::fake()->createWithContent('statement.csv', $csv),
        ])->assertStatus(200);
    }

    /**
     * What the old key did: one group for movements of different shops.
     */
    public function test_it_rebuilds_the_key_of_movements_stored_with_the_old_one(): void
    {
        $this->importNineMovements();

        Record::where('user_id', $this->user->id)->update(['merchant_key' => 'ZZZ MOBILE']);

        $this->artisan('categorization:refresh-keys', ['--user' => $this->user->id])
            ->assertSuccessful();

        $keys = Record::where('user_id', $this->user->id)->pluck('merchant_key', 'name');

        $this->assertSame('CORNER SHOP', $keys['ZZZ MOBILE EN CORNER SHOP']);
        $this->assertSame('GAS STATION', $keys['ZZZ MOBILE EN GAS STATION ONE']);
        $this->assertSame('MRS SMITH', $keys['ZZZ MOBILE EN MRS SMITH']);
        $this->assertSame('HARDWARE DEPOT', $keys['ZZZ MOBILE EN HARDWARE DEPOT']);
        $this->assertFalse($keys->contains('ZZZ MOBILE'), 'The wording shared by the file is still the key');
    }

    /**
     * Looking first has to be free of consequences.
     */
    public function test_a_dry_run_writes_nothing(): void
    {
        $this->importNineMovements();

        Record::where('user_id', $this->user->id)->update(['merchant_key' => 'ZZZ MOBILE']);

        $this->artisan('categorization:refresh-keys', ['--user' => $this->user->id, '--dry-run' => true])
            ->assertSuccessful();

        $this->assertSame(
            9,
            Record::where('user_id', $this->user->id)->where('merchant_key', 'ZZZ MOBILE')->count()
        );
    }

    /**
     * A group of different shops must not be able to become a rule again.
     */
    public function test_prune_drops_the_learned_evidence_of_a_key_that_is_gone(): void
    {
        $this->importNineMovements();

        $categoryId = (int) Record::where('user_id', $this->user->id)->value('category_id');

        CategoryCandidate::create([
            'user_id' => $this->user->id,
            'merchant_key' => 'ZZZ MOBILE',
            'category_id' => $categoryId,
            'confirmations' => 6,
            'contradictions' => 0,
            'last_seen_at' => now(),
        ]);

        $rule = CategoryRule::create([
            'user_id' => $this->user->id,
            'match_field' => 'merchant_key',
            'operator' => 'equals',
            'value' => 'ZZZ MOBILE',
            'category_id' => $categoryId,
            'priority' => 100,
            'source' => CategoryRule::SOURCE_LEARNED,
            'hits' => 6,
            'enabled' => true,
        ]);

        $this->artisan('categorization:refresh-keys', ['--user' => $this->user->id, '--prune' => true])
            ->assertSuccessful();

        $this->assertSame(
            0,
            CategoryCandidate::where('user_id', $this->user->id)->where('merchant_key', 'ZZZ MOBILE')->count()
        );
        $this->assertFalse((bool) $rule->fresh()->enabled);
    }
}
