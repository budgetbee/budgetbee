<?php

namespace Tests\Feature\Budget;

use Tests\TestCase;
use App\Models\User;
use App\Models\Budget;

class CreateBudgetTest extends TestCase
{
    private $user;

    public function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();
        parent::tearDown();
    }

    /**
     * Create a Budget Success
     */
    public function test_create_budget_succesfully(): void
    {
        $data = Budget::factory()->make()->toArray();

        $response = $this->post('/api/budget', $data);

        $response->assertStatus(200);
    }

    /**
     * Create a Budget fail: Invalid category_id
     */
    public function test_create_budget_invalid_category_id(): void
    {
        $data = Budget::factory()->make()->toArray();
        unset($data['category_id']);

        $response = $this->post('/api/budget', $data);

        $response->assertStatus(400);
    }

    /**
     * Create a Budget fail: Invalid amount
     */
    public function test_create_budget_invalid_amount(): void
    {
        $data = Budget::factory()->make()->toArray();
        unset($data['amount']);

        $response = $this->post('/api/budget', $data);

        $response->assertStatus(400);
    }
}
