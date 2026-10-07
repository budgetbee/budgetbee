<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\Record;
use App\Models\CategoryRule;
use App\Models\CategoryCandidate;
use App\Models\CategoryIgnoredPhrase;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * What the categoriser is allowed to decide on its own.
 *
 * The wording that repeats in a bank's lines is worth suggesting, so the user can
 * answer it: yes (a rule) or no (ignored). What it must never do is turn into a
 * rule by itself pointing at the category that catches everything the app does
 * not know — that is how a bank's wording became a rule for "Desconocido" in the
 * first place, and from a learned rule there was no way of saying no to it.
 *
 * The wording is invented: a real bank's wording is nobody's business in a test
 * file, and nothing about any bank is shipped with the code.
 */
class ImportLearningEvidenceTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;
    private $category;

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

        $this->category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Groceries',
            'parent_category_id' => ParentCategory::first()->id,
            'icon' => 'fa-solid fa-tag',
            'enabled' => true,
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
     * Four rows of the same wording, with or without a category of their own.
     * Four clears the learning threshold (3 hits and 80% of the evidence), so
     * what is asserted below is about what may be learned, not about numbers.
     */
    private function import(string $name, $categoryId, string $file, int $from = 1, int $rows = 4): void
    {
        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";

        for ($i = 0; $i < $rows; $i++) {
            $csv .= sprintf(
                "2026-09-%02d,%d,,expense,%s,%s,%d.00,1\n",
                $from + $i,
                $this->account->id,
                $categoryId ?? '',
                $name,
                10 + $i
            );
        }

        Storage::fake('uploads');

        // Categorizacion automatica: es lo que hace que las filas sin categoria
        // acaben en la categoria por defecto, que es el caso que se prueba.
        $this->post('/api/import', [
            'file' => UploadedFile::fake()->createWithContent($file, $csv),
            'auto_categorise' => '1',
        ])->assertStatus(200);
    }

    public function test_a_wording_the_bank_repeats_is_suggested_but_never_becomes_a_rule(): void
    {
        // Nothing about a category in the file: the app files it where it does
        // not know, which is not the user deciding anything.
        $this->import('ZZZ PAYMENT AT CORNER SHOP', null, 'a.csv');

        $candidates = $this->getJson('/api/category-rules')->assertStatus(200)->json('candidates');
        $values = array_column($candidates, 'merchant_key');

        // The words that repeat in every line come to light as the key (that is
        // the wording the bank puts in front of the shop)...
        $this->assertContains('ZZZ PAYMENT', $values);

        // ...but it is not applied on its own, and there is no rule for it.
        $this->assertSame(0, CategoryRule::where('user_id', $this->user->id)->count());
    }

    public function test_a_category_the_file_brings_is_evidence(): void
    {
        $this->import('ACME MART', $this->category->id, 'c.csv');

        $rule = CategoryRule::where('user_id', $this->user->id)
            ->where('source', CategoryRule::SOURCE_LEARNED)
            ->first();

        $this->assertNotNull($rule, 'Lo que dice el fichero si es evidencia');
        $this->assertSame((int) $this->category->id, (int) $rule->category_id);
    }

    /**
     * The case as it was told: a file full of the bank's wording, a learned rule,
     * and no way of saying no to it (Remove only deleted it, and the next file
     * learned it again).
     */
    public function test_the_user_can_say_no_to_the_wording_and_it_does_not_come_back(): void
    {
        $this->import('ZZZ PAYMENT AT CORNER SHOP', null, 'd.csv');

        // It is a suggestion, not a rule: it is the user who answers it.
        $this->assertSame(0, CategoryRule::where('user_id', $this->user->id)->count());

        $response = $this->postJson('/api/category-rules/candidates/ignore', [
            'merchant_key' => 'ZZZ PAYMENT',
        ]);

        $response->assertStatus(200);
        $this->assertSame(1, $response->json('ignored'));

        // Those words are not read any more: the movements are keyed by the shop.
        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'merchant_key' => 'CORNER SHOP',
        ]);

        // A new file with the same wording: it is not suggested again, and it is
        // not applied on its own either.
        $this->import('ZZZ PAYMENT AT CORNER SHOP', null, 'e.csv', 10);

        $candidates = $this->getJson('/api/category-rules')->assertStatus(200)->json('candidates');
        $values = array_column($candidates, 'merchant_key');

        $this->assertNotContains('ZZZ PAYMENT', $values);
        $this->assertSame(0, CategoryRule::where('user_id', $this->user->id)->count());
    }

    public function test_ignoring_a_learned_rule_takes_the_rule_with_it(): void
    {
        // A rule learned from what the file said, and the user changes his mind
        // about those words: saying no has to take the rule away, not only mark
        // something the categoriser would apply anyway.
        $this->import('ACME MART', $this->category->id, 'f.csv');

        $rule = CategoryRule::where('user_id', $this->user->id)->firstOrFail();

        $response = $this->postJson('/api/category-rules/candidates/ignore', ['merchant_key' => $rule->value]);
        $response->assertStatus(200);

        $this->assertSame(1, $response->json('rule_removed'));
        $this->assertSame(0, CategoryRule::where('user_id', $this->user->id)->count());
    }
}
