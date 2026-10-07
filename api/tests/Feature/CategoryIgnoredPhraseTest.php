<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Record;
use App\Models\CategoryRule;
use App\Models\CategoryCandidate;
use App\Models\CategoryIgnoredPhrase;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * The user says "this wording is not a merchant".
 *
 * Saying it has to mean more than hiding one suggestion: those words stop being
 * read when the merchant key is worked out, so the words that come after them
 * become the key and the shops come back one by one. On the next import the same
 * wording is not read either, and the suggestions are about shops.
 *
 * The wording is invented: a real bank's wording is nobody's business in a test
 * file, and nothing about any bank is shipped with the code.
 */
class CategoryIgnoredPhraseTest extends TestCase
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
        CategoryIgnoredPhrase::where('user_id', $this->user->id)->delete();
        $this->account->delete();
        $this->userCurrency->delete();
        $this->user->delete();

        parent::tearDown();
    }

    /**
     * A tiny file, so the merchant key comes out of the text alone: the wording
     * that repeats in every line ends up being the key of all of them.
     */
    private function import(array $names, string $file = 'statement.csv', $categoryId = null): void
    {
        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";
        $day = 1;

        foreach ($names as $name) {
            $csv .= sprintf(
                "2026-09-%02d,%d,,expense,%s,%s,10.00,1\n",
                $day++,
                $this->account->id,
                $categoryId ?? '',
                $name
            );
        }

        Storage::fake('uploads');

        $this->post('/api/import', [
            'file' => UploadedFile::fake()->createWithContent($file, $csv),
        ])->assertStatus(200);
    }

    /**
     * Una categoria propia: lo que el fichero dice de su puño y letra es lo
     * unico que cuenta como evidencia para aprender.
     */
    private function category(): \App\Models\Category
    {
        return \App\Models\Category::firstOrCreate(
            ['user_id' => $this->user->id, 'name' => 'Groceries'],
            [
                'parent_category_id' => \App\Models\ParentCategory::first()->id,
                'icon' => 'fa-solid fa-tag',
                'enabled' => true,
            ]
        );
    }

    private function keys(): array
    {
        return Record::where('user_id', $this->user->id)->pluck('merchant_key', 'name')->all();
    }

    public function test_ignoring_a_wording_makes_the_next_words_the_key(): void
    {
        $this->import([
            'ZZZ PAYMENT AT GAS STATION ONE',
            'ZZZ PAYMENT AT CORNER SHOP',
            'ZZZ PAYMENT AT MRS SMITH',
        ]);

        // Without anything said about it, the wording that repeats is the key.
        $this->assertSame('ZZZ PAYMENT', $this->keys()['ZZZ PAYMENT AT GAS STATION ONE']);

        $response = $this->postJson('/api/category-rules/candidates/ignore', [
            'merchant_key' => 'ZZZ PAYMENT',
        ]);

        $response->assertStatus(200)->assertJson(['moved' => 3]);

        // Now every movement is keyed by its own shop.
        $keys = $this->keys();
        $this->assertSame('GAS STATION', $keys['ZZZ PAYMENT AT GAS STATION ONE']);
        $this->assertSame('CORNER SHOP', $keys['ZZZ PAYMENT AT CORNER SHOP']);
        $this->assertSame('MRS SMITH', $keys['ZZZ PAYMENT AT MRS SMITH']);

        $this->assertDatabaseHas('category_ignored_phrases', [
            'user_id' => $this->user->id,
            'phrase' => 'ZZZ PAYMENT',
        ]);
    }

    /**
     * The point of it: the next file is not read with those words either, and
     * the suggestions are about shops.
     */
    public function test_the_next_import_does_not_read_those_words(): void
    {
        $this->import([
            'ZZZ PAYMENT AT GAS STATION ONE',
            'ZZZ PAYMENT AT CORNER SHOP',
            'ZZZ PAYMENT AT MRS SMITH',
        ]);

        $this->postJson('/api/category-rules/candidates/ignore', ['merchant_key' => 'ZZZ PAYMENT'])
            ->assertStatus(200);

        // Con categoria propia, que es lo que hace que el aparato lo proponga:
        // sin ella no hay evidencia y no hay sugerencia que mirar.
        $this->import([
            'ZZZ PAYMENT AT HARDWARE DEPOT',
            'ZZZ PAYMENT AT HARDWARE DEPOT',
            'ZZZ PAYMENT AT HARDWARE DEPOT',
            'ZZZ PAYMENT AT HARDWARE DEPOT',
        ], 'next.csv', $this->category()->id);

        $keys = $this->keys();
        $this->assertSame('HARDWARE DEPOT', $keys['ZZZ PAYMENT AT HARDWARE DEPOT']);

        // The suggestion list talks about shops, not about the bank's wording.
        $candidates = $this->getJson('/api/category-rules')->assertStatus(200)->json('candidates');
        $values = array_column($candidates, 'merchant_key');

        $this->assertContains('HARDWARE DEPOT', $values);
        $this->assertNotContains('ZZZ PAYMENT', $values);
    }

    /**
     * A ruling about words is one user's decision, and it stays his.
     */
    public function test_one_user_saying_it_does_not_change_another_user(): void
    {
        $other = User::factory()->create(['password' => 'UserTest123']);

        $this->import(['ZZZ PAYMENT AT CORNER SHOP']);

        Record::create([
            'user_id' => $other->id,
            'date' => '2026-09-01',
            'name' => 'ZZZ PAYMENT AT CORNER SHOP',
            'amount' => -10.00,
            'type' => 'expense',
            'rate' => 1,
            'from_account_id' => $this->account->id,
            'code' => sprintf('%012d', 910000000000 + $other->id),
            'category_id' => (int) Record::where('user_id', $this->user->id)->value('category_id'),
        ]);

        $this->postJson('/api/category-rules/candidates/ignore', ['merchant_key' => 'ZZZ PAYMENT'])
            ->assertStatus(200);

        // The other user's categoriser still reads those words.
        $this->assertSame(
            'ZZZ PAYMENT',
            app(\App\Services\Categorization\CategoryCorpus::class)
                ->normalizerFor($other->id)
                ->normalize('ZZZ PAYMENT AT CORNER SHOP')
        );

        Record::where('user_id', $other->id)->delete();
        $other->delete();
    }

    /**
     * Changing his mind has to be as easy as saying it.
     */
    public function test_reading_the_wording_again_can_be_undone(): void
    {
        $this->import(['ZZZ PAYMENT AT CORNER SHOP']);

        $this->postJson('/api/category-rules/candidates/ignore', ['merchant_key' => 'ZZZ PAYMENT'])
            ->assertStatus(200);

        $this->assertDatabaseHas('category_ignored_phrases', ['user_id' => $this->user->id, 'phrase' => 'ZZZ PAYMENT']);

        $this->postJson('/api/category-rules/candidates/restore', ['merchant_key' => 'ZZZ PAYMENT'])
            ->assertStatus(200);

        $this->assertDatabaseMissing('category_ignored_phrases', ['user_id' => $this->user->id, 'phrase' => 'ZZZ PAYMENT']);
        $this->assertSame('ZZZ PAYMENT', $this->keys()['ZZZ PAYMENT AT CORNER SHOP']);
    }
}
