<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\Record;
use App\Models\User;
use App\Models\UserCurrency;
use Tests\TestCase;

/**
 * One user cannot touch another user's data: no movements into somebody else's
 * accounts, no moving his own movement onto a foreign account, and no taking
 * over a category that is not his.
 *
 * This is advisory GHSA-95c8-2683-7xfc. Accounts and categories have an owner,
 * and every endpoint has to check it, not just that the row exists.
 */
class CrossUserOwnershipTest extends TestCase
{
    private User $owner;
    private User $intruder;

    private UserCurrency $ownerCurrency;
    private UserCurrency $intruderCurrency;

    private Account $ownerAccount;
    private Account $intruderAccount;

    private ParentCategory $ownerParent;
    private ParentCategory $intruderParent;

    private Category $ownerCategory;
    private Category $intruderCategory;
    private Category $sharedCategory;

    public function setUp(): void
    {
        parent::setUp();

        $this->owner = User::factory()->create(['password' => 'UserTest123']);
        $this->intruder = User::factory()->create(['password' => 'UserTest123']);

        // The currency factory reads the signed-in user, so each one has to be
        // signed in before his own currency is created.
        $this->actingAs($this->owner);
        $this->ownerCurrency = UserCurrency::factory()->create(['user_id' => $this->owner->id]);
        $this->actingAs($this->intruder);
        $this->intruderCurrency = UserCurrency::factory()->create(['user_id' => $this->intruder->id]);

        $this->ownerAccount = Account::factory()->create([
            'user_id' => $this->owner->id,
            'currency_id' => $this->ownerCurrency->id,
        ]);
        $this->intruderAccount = Account::factory()->create([
            'user_id' => $this->intruder->id,
            'currency_id' => $this->intruderCurrency->id,
        ]);

        $this->ownerParent = ParentCategory::create([
            'user_id' => $this->owner->id,
            'name' => 'Owner family ' . uniqid(),
            'color' => '#112233',
            'icon' => 'faTag',
        ]);
        $this->intruderParent = ParentCategory::create([
            'user_id' => $this->intruder->id,
            'name' => 'Intruder family ' . uniqid(),
            'color' => '#445566',
            'icon' => 'faTag',
        ]);

        $this->ownerCategory = Category::create([
            'user_id' => $this->owner->id,
            'name' => 'Owner category ' . uniqid(),
            'icon' => 'faTag',
            'parent_category_id' => $this->ownerParent->id,
        ]);
        $this->intruderCategory = Category::create([
            'user_id' => $this->intruder->id,
            'name' => 'Intruder category ' . uniqid(),
            'icon' => 'faTag',
            'parent_category_id' => $this->intruderParent->id,
        ]);
        // Shared category: one without an owner can be used by anybody.
        $this->sharedCategory = Category::create([
            'user_id' => null,
            'name' => 'Shared category ' . uniqid(),
            'icon' => 'faTag',
            'parent_category_id' => $this->intruderParent->id,
        ]);
    }

    public function tearDown(): void
    {
        // Movements go first: foreign keys tie categories and accounts.
        $categories = [
            $this->ownerCategory->id,
            $this->intruderCategory->id,
            $this->sharedCategory->id,
        ];
        $accounts = [$this->ownerAccount->id, $this->intruderAccount->id];

        // Movements are soft deleted: without forceDelete the row stays behind
        // and the foreign key blocks deleting the category and the account.
        $movements = Record::withTrashed()
            ->whereIn('user_id', [$this->owner->id, $this->intruder->id])
            ->orWhereIn('category_id', $categories)
            ->orWhereIn('from_account_id', $accounts)
            ->orWhereIn('to_account_id', $accounts)
            ->get();

        foreach ($movements as $movement) {
            $movement->forceDelete();
        }

        // The learner leaves candidates behind for the categories it saw.
        \App\Models\CategoryCandidate::whereIn('category_id', $categories)->delete();
        \App\Models\CategoryRule::whereIn('category_id', $categories)->delete();

        Category::whereIn('id', $categories)->delete();
        ParentCategory::whereIn('id', [$this->ownerParent->id, $this->intruderParent->id])->delete();
        Account::whereIn('id', $accounts)->delete();

        parent::tearDown();
    }

    private function movement(array $changes = []): array
    {
        return array_merge([
            'date' => '2026-11-20',
            'from_account_id' => $this->intruderAccount->id,
            'type' => 'expense',
            'amount' => 25.5,
            'name' => 'Purchase',
            'description' => 'Purchase',
            'category_id' => $this->intruderCategory->id,
        ], $changes);
    }

    /** A user cannot create a movement against somebody else's account. */
    public function testCannotCreateMovementOnAnotherUsersAccount(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/record', $this->movement([
            'from_account_id' => $this->ownerAccount->id,
        ]));

        $response->assertStatus(422);
        $this->assertSame(0, Record::where('from_account_id', $this->ownerAccount->id)->count());
    }

    /** A user cannot create a movement with somebody else's category. */
    public function testCannotCreateMovementWithAnotherUsersCategory(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/record', $this->movement([
            'category_id' => $this->ownerCategory->id,
        ]));

        $response->assertStatus(422);
        $this->assertSame(0, Record::where('category_id', $this->ownerCategory->id)->count());
    }

    /** A shared category (no owner) can still be used. */
    public function testCanUseSharedCategory(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/record', $this->movement([
            'category_id' => $this->sharedCategory->id,
        ]));

        $response->assertStatus(200);
    }

    /** A user cannot move his own movement onto somebody else's account. */
    public function testCannotMoveHisMovementToAnotherUsersAccount(): void
    {
        $movement = Record::factory()->create([
            'user_id' => $this->intruder->id,
            'from_account_id' => $this->intruderAccount->id,
            'to_account_id' => null,
            'category_id' => $this->intruderCategory->id,
            'type' => 'expense',
            'amount' => -10,
        ]);

        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/record/' . $movement->id, $this->movement([
            'from_account_id' => $this->ownerAccount->id,
        ]));

        $response->assertStatus(422);
        $this->assertSame(
            $this->intruderAccount->id,
            (int) Record::find($movement->id)->from_account_id
        );
    }

    /** A user cannot take over somebody else's category by editing it. */
    public function testCannotTakeOverAnotherUsersCategory(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/category/' . $this->ownerCategory->id, [
            'name' => 'Hijacked category',
        ]);

        $response->assertStatus(404);

        $category = Category::find($this->ownerCategory->id);
        $this->assertSame((int) $this->owner->id, (int) $category->user_id);
        $this->assertNotSame('Hijacked category', $category->name);
    }

    /** Editing a user's own category still works and keeps the same owner. */
    public function testCanEditHisOwnCategory(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/category/' . $this->intruderCategory->id, [
            'name' => 'My category',
        ]);

        $response->assertStatus(200);

        $category = Category::find($this->intruderCategory->id);
        $this->assertSame('My category', $category->name);
        $this->assertSame((int) $this->intruder->id, (int) $category->user_id);
    }

    /** A user cannot hang his category from somebody else's tree. */
    public function testCannotUseAnotherUsersParentCategory(): void
    {
        $this->actingAs($this->intruder);

        $response = $this->postJson('/api/category/' . $this->intruderCategory->id, [
            'parent_category_id' => $this->ownerParent->id,
        ]);

        $response->assertStatus(422);
        $this->assertSame(
            (int) $this->intruderParent->id,
            (int) Category::find($this->intruderCategory->id)->parent_category_id
        );
    }
}
