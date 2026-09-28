<?php

namespace Tests\Feature\Category;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\UserCurrency;

class CategoryTypeSuggestionTest extends TestCase
{
    private $user;
    private $account;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);
        $this->actingAs($this->user);

        $currency = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'currency_id' => $currency->id,
        ]);
    }

    private function parent(string $name, string $type = 'expense', ?User $user = null): ParentCategory
    {
        return ParentCategory::create([
            'user_id' => ($user ?? $this->user)->id,
            'name' => $name,
            'color' => '#112233',
            'icon' => 'faTag',
            'type' => $type,
            'enabled' => 1,
            'position' => 0,
        ]);
    }

    private function recordIn(ParentCategory $parent, string $type, float $amount): Record
    {
        $category = Category::create([
            'user_id' => $parent->user_id,
            'name' => 'Child of ' . $parent->name,
            'icon' => 'faTag',
            'parent_category_id' => $parent->id,
            'enabled' => 1,
            'position' => 0,
        ]);

        return Record::create([
            'user_id' => $parent->user_id,
            'date' => date('Y-m-d'),
            'from_account_id' => $this->account->id,
            'to_account_id' => null,
            'type' => $type,
            'category_id' => $category->id,
            'name' => 'Test ' . $type,
            'amount' => $amount,
            'rate' => 1,
        ]);
    }

    private function suggestedIds(): array
    {
        return array_column($this->get('/api/category-type-suggestions')->json('suggestions'), 'id');
    }

    /**
     * The notice is shown once: pending while there is something to fix, and
     * never again as soon as the user has closed it.
     */
    public function testTheNoticeIsShownOnlyOnce(): void
    {
        $this->parent('Incomes');

        $this->get('/api/category-type-suggestions')->assertStatus(200)->assertJson(['should_prompt' => true]);

        $this->post('/api/category-type-suggestions/dismiss')->assertStatus(200);

        $this->get('/api/category-type-suggestions')->assertJson(['should_prompt' => false]);
        $this->assertNotNull($this->user->fresh()->category_types_intro_seen_at);
    }

    /**
     * An installation created with this version already has its categories
     * typed: there is nothing to fix, so the user is not bothered with a notice
     * about categories that predate the flag.
     */
    public function testAnInstallationWithNothingToFixIsNotBothered(): void
    {
        $this->parent('Incomes', 'income');

        $groceries = $this->parent('Groceries');
        $this->recordIn($groceries, 'expense', -120);

        $response = $this->get('/api/category-type-suggestions');

        $response->assertStatus(200)->assertJson(['should_prompt' => false, 'suggestions' => []]);
        $this->assertNull($this->user->fresh()->category_types_intro_seen_at);
    }

    /**
     * The seeded name is the first signal, matched whole so a real expense
     * category like "Income tax" is not suggested.
     */
    public function testSuggestsTheSeededIncomeCategoryByName(): void
    {
        $incomes = $this->parent('Incomes');
        $this->parent('Ingresos');
        $this->parent('Income tax');
        $this->parent('Comida');

        $suggested = $this->suggestedIds();

        $this->assertContains($incomes->id, $suggested);
        $this->assertCount(2, $suggested);
    }

    /**
     * A category the user renamed or created is caught by its records.
     */
    public function testSuggestsACategoryWhereIncomeRecordsPredominate(): void
    {
        $renamed = $this->parent('Cobros varios');
        $this->recordIn($renamed, 'income', 1500);
        $this->recordIn($renamed, 'income', 300);

        $this->assertContains($renamed->id, $this->suggestedIds());
    }

    /**
     * Expenses winning, or a category already marked as income, are not
     * suggested: a refund does not turn a category around.
     */
    public function testDoesNotSuggestExpenseCategoriesOrOnesAlreadyIncome(): void
    {
        $groceries = $this->parent('Groceries');
        $this->recordIn($groceries, 'expense', -120);
        $this->recordIn($groceries, 'income', 15);

        $alreadyIncome = $this->parent('Incomes', 'income');

        $suggested = $this->suggestedIds();

        $this->assertNotContains($groceries->id, $suggested);
        $this->assertNotContains($alreadyIncome->id, $suggested);
    }

    /**
     * Accepting marks exactly those categories, scoped to the user, and closes
     * the notice.
     */
    public function testAcceptingMarksTheChosenCategoriesOnly(): void
    {
        $incomes = $this->parent('Incomes');
        $untouched = $this->parent('Comida');

        $otherUser = User::factory()->create();
        $someoneElses = $this->parent('Incomes', 'expense', $otherUser);

        $response = $this->post('/api/category-type-suggestions/accept', [
            'ids' => [$incomes->id, $untouched->id, $someoneElses->id],
        ]);

        $response->assertStatus(200)->assertJson(['updated' => 2]);

        $this->assertSame('income', $incomes->fresh()->type);
        $this->assertSame('income', $untouched->fresh()->type);
        $this->assertSame('expense', $someoneElses->fresh()->type);
        $this->assertNotNull($this->user->fresh()->category_types_intro_seen_at);
    }

    /**
     * The tour of the category screen is tracked separately.
     */
    public function testTheTourFlagIsTrackedOnItsOwn(): void
    {
        $this->get('/api/category-type-suggestions')->assertJson(['tour_seen' => false]);

        $this->post('/api/category-type-suggestions/tour-seen')->assertStatus(200);

        $this->get('/api/category-type-suggestions')->assertJson(['tour_seen' => true]);
        $this->assertNotNull($this->user->fresh()->category_types_tour_seen_at);
    }
}
