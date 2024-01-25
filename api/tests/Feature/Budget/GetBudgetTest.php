<?php

namespace Tests\Feature\Budget;

use Tests\TestCase;
use App\Models\User;
use App\Models\Budget;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class GetBudgetTest extends TestCase
{
    private $user;
    private $budgets = [];

    public function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();

        for ($i = 0; $i < 2; $i++) {
            $this->budgets[] = Budget::factory()->create(['user_id' => $this->user->id]);
        }

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();
        foreach ($this->budgets as $budget) {
            $budget->delete();
        }
        parent::tearDown();
    }

    /**
     * Get all Budgets Success
     */
    public function test_get_all_budgets_succesfully(): void
    {
        $response = $this->get('/api/budget');

        $response->assertStatus(200)
             ->assertJsonStructure(['data'])
             ->assertJsonCount(2, 'data');
    }

    /**
     * Get a single Budget Success
     */
    public function test_get_single_budget_succesfully(): void
    {
        $budget_id = $this->budgets[1]->id;
        $response = $this->get("/api/budget/$budget_id");

        $response->assertStatus(200)
             ->assertJsonStructure(['data'])
             ->assertJsonFragment(['id' => $budget_id]);
    }

    /**
     * Get a single Budget Fail: Budget not exists
     */
    public function test_get_single_budget_fail_not_exists(): void
    {
        $budget_id = -1;
        $response = $this->get("/api/budget/$budget_id");

        $response->assertStatus(400)
             ->assertJsonStructure(['message']);
    }

}
