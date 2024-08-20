<?php

namespace Tests\Feature\Rule;

use Tests\TestCase;
use App\Models\Rule;
use App\Models\User;
use App\Models\RuleWhenTypes;
use App\Models\Types\RuleActionTypes;
use App\Models\Types\RuleConditionTypes;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

class RuleTest extends TestCase
{
    private $user;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();

        parent::tearDown();
    }

    /**
     * Create a rule Fail
     */
    public function testCreateRuleFail(): void
    {
        $data = [
            'name' => 'Testing rules',
            'enabled' => 1
        ];

        $response = $this->post('/api/rule', $data);

        $response->assertStatus(302);
    }

    /**
     * Create a rule Fail
     */
    public function testGetUserRules(): void
    {
        $response = $this->get('/api/rule');

        $response->assertStatus(200);
    }

    /**
     * Create a rule Success
     */
    // public function testGetRuleSuccess(): void
    // {
    //     $rule = Rule::inRandomOrder()->first();
    //     $response = $this->get('/api/rule/' . $rule->id);

    //     $response->assertStatus(200);
    //     $response->assertInteger($rule->id);
    // }
}