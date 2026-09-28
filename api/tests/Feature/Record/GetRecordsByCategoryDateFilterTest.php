<?php

namespace Tests\Feature\Record;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\UserCurrency;

class GetRecordsByCategoryDateFilterTest extends TestCase
{
    private $user;
    private $account;
    private $category;
    private $currency;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);
        $this->actingAs($this->user);

        $this->currency = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'currency_id' => $this->currency->id,
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

    private function makeRecord(string $date, float $amount = -10)
    {
        return Record::create([
            'user_id' => $this->user->id,
            'date' => $date,
            'from_account_id' => $this->account->id,
            'to_account_id' => null,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test record ' . $date,
            'amount' => $amount,
            'rate' => 1,
        ]);
    }

    /**
     * The records modal of a subcategory must respect the dashboard date filter.
     */
    public function testFiltersByFromDate(): void
    {
        $this->makeRecord(date('Y-m-d', strtotime('-40 days')));
        $old = $this->makeRecord(date('Y-m-d', strtotime('-20 days')));
        $recent = $this->makeRecord(date('Y-m-d', strtotime('-2 days')));

        $from = date('Y-m-d', strtotime('-30 days'));

        $response = $this->get('/api/record/category/' . $this->category->id . '?from=' . $from);
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(2, $ids);
        $this->assertContains($old->id, $ids);
        $this->assertContains($recent->id, $ids);
    }

    /**
     * A full range (from + to) only returns the records inside it.
     */
    public function testFiltersByFromAndToDate(): void
    {
        $this->makeRecord(date('Y-m-d', strtotime('-40 days')));
        $middle = $this->makeRecord(date('Y-m-d', strtotime('-20 days')));
        $this->makeRecord(date('Y-m-d', strtotime('-2 days')));

        $from = date('Y-m-d', strtotime('-30 days'));
        $to = date('Y-m-d', strtotime('-10 days'));

        $response = $this->get(
            '/api/record/category/' . $this->category->id . '?from=' . $from . '&to=' . $to
        );
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(1, $ids);
        $this->assertContains($middle->id, $ids);
    }

    /**
     * With "to" alone the upper bound is still applied.
     */
    public function testFiltersByToDateOnly(): void
    {
        $this->makeRecord(date('Y-m-d', strtotime('-40 days')));
        $old = $this->makeRecord(date('Y-m-d', strtotime('-20 days')));
        $this->makeRecord(date('Y-m-d', strtotime('-2 days')));

        $to = date('Y-m-d', strtotime('-10 days'));

        $response = $this->get('/api/record/category/' . $this->category->id . '?to=' . $to);
        $response->assertStatus(200);

        $ids = array_column($response->json(), 'id');
        $this->assertCount(2, $ids);
        $this->assertContains($old->id, $ids);
    }

    /**
     * Without dates it returns everything (previous behaviour, unchanged).
     */
    public function testWithoutDatesReturnsEverything(): void
    {
        $this->makeRecord(date('Y-m-d', strtotime('-40 days')));
        $this->makeRecord(date('Y-m-d', strtotime('-20 days')));
        $this->makeRecord(date('Y-m-d', strtotime('-2 days')));

        $response = $this->get('/api/record/category/' . $this->category->id);
        $response->assertStatus(200);

        $this->assertCount(3, $response->json());
    }
}
