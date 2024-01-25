<?php

namespace Tests\Feature\Budget;

use Tests\TestCase;
use App\Models\Budget;
use App\Models\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class DeleteBudgetTest extends TestCase
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
     * Delete Budget Success
     */
    public function test_delete_budgets_succesfully(): void
    {
        $response = $this->delete('/api/budget/' . $this->budget->id);

        $response->assertStatus(200)
             ->assertJsonStructure(['message']);
        
        $this->assertModelMissing($this->budget);
    }
}
