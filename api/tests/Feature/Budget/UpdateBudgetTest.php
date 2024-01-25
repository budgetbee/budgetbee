<?php

namespace Tests\Feature\Budget;

use Tests\TestCase;
use App\Models\User;
use App\Models\Budget;

class UpdateBudgetTest extends TestCase
{
    private $user;
    private $budget;

    public function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        $this->budget = Budget::factory()->create(['user_id' => $this->user->id]);
        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();
        $this->budget->delete();
        parent::tearDown();
    }

    /**
     * Update a Budget Success
     */
    public function test_update_budget_succesfully(): void
    {
        $data = Budget::factory()->make()->toArray();

        $response = $this->post('/api/budget/' . $this->budget->id, $data);

        $response->assertStatus(200);
    }

    /**
     * Update a Budget fail: Invalid category_id
     */
    public function test_update_budget_invalid_category_id(): void
    {
        $data = Budget::factory()->make()->toArray();
        unset($data['category_id']);

        $response = $this->post('/api/budget/' . $this->budget->id, $data);

        $response->assertStatus(400);
    }

    /**
     * Update a Budget fail: Invalid amount
     */
    public function test_update_budget_invalid_amount(): void
    {
        $data = Budget::factory()->make()->toArray();
        unset($data['amount']);

        $response = $this->post('/api/budget/' . $this->budget->id, $data);

        $response->assertStatus(400);
    }
}
