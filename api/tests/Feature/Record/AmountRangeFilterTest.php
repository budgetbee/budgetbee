<?php

namespace Tests\Feature\Record;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\UserCurrency;

/**
 * The optional amount range on the records endpoint (amount_min / amount_max).
 *
 * The filter compares against the magnitude of the amount, so it works the same
 * for the negative amounts an expense is stored with.
 */
class AmountRangeFilterTest extends TestCase
{
    private $user;
    private $account;
    private $category;

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

        $parent = ParentCategory::create([
            'user_id' => $this->user->id,
            'name' => 'Test Parent ' . uniqid(),
            'color' => '#112233',
            'icon' => 'faTag',
            'type' => 'expense',
            'enabled' => 1,
            'position' => 0,
        ]);

        $this->category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Test Cat ' . uniqid(),
            'icon' => 'faTag',
            'parent_category_id' => $parent->id,
            'enabled' => 1,
            'position' => 0,
        ]);
    }

    private function makeRecord(float $amount)
    {
        return Record::create([
            'user_id' => $this->user->id,
            'date' => date('Y-m-d'),
            'from_account_id' => $this->account->id,
            'to_account_id' => null,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test record ' . uniqid(),
            'amount' => $amount,
            'rate' => 1,
        ]);
    }

    public function testMinAmountLeavesOutTheSmallerMovements(): void
    {
        $small = $this->makeRecord(-5);
        $big = $this->makeRecord(-500);

        $response = $this->get('/api/record?amount_min=100');
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(1, $ids);
        $this->assertContains($big->id, $ids);
        $this->assertNotContains($small->id, $ids);
    }

    public function testMaxAmountLeavesOutTheBiggerMovements(): void
    {
        $small = $this->makeRecord(-5);
        $big = $this->makeRecord(-500);

        $response = $this->get('/api/record?amount_max=100');
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(1, $ids);
        $this->assertContains($small->id, $ids);
        $this->assertNotContains($big->id, $ids);
    }

    public function testAmountRangeKeepsOnlyTheMovementsInsideIt(): void
    {
        $this->makeRecord(-5);
        $middle = $this->makeRecord(-50);
        $this->makeRecord(-5000);

        $response = $this->get('/api/record?amount_min=10&amount_max=100');
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(1, $ids);
        $this->assertContains($middle->id, $ids);
    }

    public function testWithoutAmountRangeEverythingComesBack(): void
    {
        $this->makeRecord(-5);
        $this->makeRecord(-500);

        $response = $this->get('/api/record');
        $response->assertStatus(200);

        $this->assertCount(2, $response->json());
    }
}
