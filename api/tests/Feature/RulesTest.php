<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Models\RuleWhenTypes;
use App\Models\Rule;
use App\Models\RuleConditionTypes;
use App\Models\RuleActionTypes;

class RulesTest extends TestCase
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
     * Create a rule Success
     */
    public function testCreateRule(): void
    {
        $conditionType = RuleConditionTypes::inRandomOrder()->first();
        $conditionType2 = RuleConditionTypes::inRandomOrder()->first();
        $actionType = RuleActionTypes::inRandomOrder()->first();
        $actionType2 = RuleActionTypes::inRandomOrder()->first();

        $data = [
            'name' => 'Testing rules',
            'enabled' => 1,
            'conditions' => [
                $conditionType->id => 'asdf',
                $conditionType2->id => 'asdf2'
            ],
            'actions' => [
                $actionType->id => '',
                $actionType2->id => ''
            ]
        ];

        $response = $this->post('/api/rule', $data);

        $response->assertStatus(200);
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
