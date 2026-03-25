<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\ApiKey;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\Record;
use App\Models\UserCurrency;

class ExternalApiTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;
    private $apiKeyPlain;
    private $apiKey;
    private $category;
    private $parentCategory;

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

        $this->parentCategory = ParentCategory::where('user_id', $this->user->id)->first();
        $this->category = Category::where('user_id', $this->user->id)->first();

        $this->apiKeyPlain = 'test-api-key-plain-text-value-123456';
        $this->apiKey = ApiKey::create([
            'user_id' => $this->user->id,
            'name' => 'Test API Key',
            'key' => hash('sha256', $this->apiKeyPlain),
        ]);
    }

    public function tearDown(): void
    {
        Record::where('user_id', $this->user->id)->forceDelete();
        $this->apiKey->delete();
        $this->account->delete();
        $this->userCurrency->delete();
        $this->user->delete();

        parent::tearDown();
    }

    private function apiHeaders(): array
    {
        return ['X-API-Key' => $this->apiKeyPlain];
    }

    // ---- Auth Tests ----

    public function testAccessWithoutApiKeyReturns401(): void
    {
        $response = $this->getJson('/api/v1/external/accounts');

        $response->assertStatus(401);
    }

    public function testAccessWithInvalidApiKeyReturns401(): void
    {
        $response = $this->getJson('/api/v1/external/accounts', [
            'X-API-Key' => 'invalid-key',
        ]);

        $response->assertStatus(401);
    }

    public function testAccessWithExpiredApiKeyReturns401(): void
    {
        $this->apiKey->update(['expires_at' => now()->subDay()]);

        $response = $this->getJson('/api/v1/external/accounts', $this->apiHeaders());

        $response->assertStatus(401);
    }

    // ---- Accounts ----

    public function testGetAccounts(): void
    {
        $response = $this->getJson('/api/v1/external/accounts', $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonIsArray();
    }

    public function testGetAccountById(): void
    {
        $response = $this->getJson('/api/v1/external/accounts/' . $this->account->id, $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $this->account->id]);
    }

    public function testGetAccountNotFound(): void
    {
        $response = $this->getJson('/api/v1/external/accounts/99999', $this->apiHeaders());

        $response->assertStatus(404);
    }

    public function testGetAccountTypes(): void
    {
        $response = $this->getJson('/api/v1/external/account-types', $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonIsArray();
    }

    // ---- Categories ----

    public function testGetCategories(): void
    {
        $response = $this->getJson('/api/v1/external/categories', $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonIsArray();
    }

    public function testGetParentCategories(): void
    {
        $response = $this->getJson('/api/v1/external/parent-categories', $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonIsArray();
    }

    // ---- Records CRUD ----

    public function testCreateRecord(): void
    {
        $data = [
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test expense via API',
            'amount' => 50.00,
            'description' => 'Test description',
        ];

        $response = $this->postJson('/api/v1/external/records', $data, $this->apiHeaders());

        $response->assertStatus(201);
        $response->assertJsonFragment(['name' => 'Test expense via API']);
    }

    public function testCreateRecordValidation(): void
    {
        $response = $this->postJson('/api/v1/external/records', [], $this->apiHeaders());

        $response->assertStatus(422);
    }

    public function testCreateIncomeRecord(): void
    {
        $data = [
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'income',
            'category_id' => $this->category->id,
            'name' => 'Test income',
            'amount' => 100.00,
        ];

        $response = $this->postJson('/api/v1/external/records', $data, $this->apiHeaders());

        $response->assertStatus(201);

        $record = Record::find($response->json()['id']);
        $this->assertGreaterThan(0, $record->amount);
    }

    public function testCreateExpenseRecordHasNegativeAmount(): void
    {
        $data = [
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test expense',
            'amount' => 50.00,
        ];

        $response = $this->postJson('/api/v1/external/records', $data, $this->apiHeaders());

        $response->assertStatus(201);

        $record = Record::find($response->json()['id']);
        $this->assertLessThan(0, $record->amount);
    }

    public function testGetRecords(): void
    {
        Record::create([
            'user_id' => $this->user->id,
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test record',
            'amount' => -50.00,
        ]);

        $response = $this->getJson('/api/v1/external/records', $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonStructure(['data', 'current_page', 'last_page', 'per_page', 'total']);
    }

    public function testGetRecordById(): void
    {
        $record = Record::create([
            'user_id' => $this->user->id,
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Test record',
            'amount' => -50.00,
        ]);

        $response = $this->getJson('/api/v1/external/records/' . $record->id, $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonFragment(['id' => $record->id]);
    }

    public function testGetRecordNotFound(): void
    {
        $response = $this->getJson('/api/v1/external/records/99999', $this->apiHeaders());

        $response->assertStatus(404);
    }

    public function testUpdateRecord(): void
    {
        $record = Record::create([
            'user_id' => $this->user->id,
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Original name',
            'amount' => -50.00,
        ]);

        $data = [
            'date' => '2024-03-26',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Updated name',
            'amount' => 75.00,
        ];

        $response = $this->putJson('/api/v1/external/records/' . $record->id, $data, $this->apiHeaders());

        $response->assertStatus(200);
        $response->assertJsonFragment(['name' => 'Updated name']);
    }

    public function testUpdateRecordNotFound(): void
    {
        $data = [
            'date' => '2024-03-26',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'amount' => 75.00,
        ];

        $response = $this->putJson('/api/v1/external/records/99999', $data, $this->apiHeaders());

        $response->assertStatus(404);
    }

    public function testDeleteRecord(): void
    {
        $record = Record::create([
            'user_id' => $this->user->id,
            'date' => '2024-03-25',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'To delete',
            'amount' => -50.00,
        ]);

        $response = $this->deleteJson('/api/v1/external/records/' . $record->id, [], $this->apiHeaders());

        $response->assertStatus(200);
        $this->assertNull(Record::find($record->id));
    }

    public function testDeleteRecordNotFound(): void
    {
        $response = $this->deleteJson('/api/v1/external/records/99999', [], $this->apiHeaders());

        $response->assertStatus(404);
    }

    public function testCannotAccessOtherUserRecords(): void
    {
        $otherUser = User::factory()->create(['password' => 'UserTest123']);
        $this->actingAs($otherUser);
        $otherCurrency = UserCurrency::factory()->create(['user_id' => $otherUser->id]);
        $this->actingAs($this->user);
        $otherAccount = Account::factory()->create([
            'user_id' => $otherUser->id,
            'currency_id' => $otherCurrency->id,
        ]);

        $otherCategory = Category::where('user_id', $otherUser->id)->first();

        $record = Record::create([
            'user_id' => $otherUser->id,
            'date' => '2024-03-25',
            'from_account_id' => $otherAccount->id,
            'type' => 'expense',
            'category_id' => $otherCategory->id,
            'name' => 'Other user record',
            'amount' => -50.00,
        ]);

        $response = $this->getJson('/api/v1/external/records/' . $record->id, $this->apiHeaders());

        $response->assertStatus(404);

        $record->forceDelete();
        $otherAccount->delete();
        $otherCurrency->delete();
        $otherUser->delete();
    }

    public function testGetRecordsWithFilters(): void
    {
        Record::create([
            'user_id' => $this->user->id,
            'date' => '2024-03-20',
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'category_id' => $this->category->id,
            'name' => 'Filtered record',
            'amount' => -30.00,
        ]);

        $response = $this->getJson('/api/v1/external/records?from_date=2024-03-19&to_date=2024-03-21&type=expense', $this->apiHeaders());

        $response->assertStatus(200);
        $this->assertGreaterThanOrEqual(1, $response->json()['total']);
    }

    public function testApiKeyLastUsedAtIsUpdated(): void
    {
        $this->getJson('/api/v1/external/accounts', $this->apiHeaders());

        $this->apiKey->refresh();
        $this->assertNotNull($this->apiKey->last_used_at);
    }
}
