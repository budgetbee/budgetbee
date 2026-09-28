<?php

namespace Tests\Feature\Category;

use Tests\TestCase;
use App\Models\User;
use App\Models\Record;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\UserCurrency;
use Illuminate\Support\Facades\DB;

class BackfillParentCategoryTypesTest extends TestCase
{
    private const MIGRATION = 'database/migrations/2026_09_28_000000_backfill_parent_category_types.php';

    private $user;
    private $account;

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
    }

    private function parent(string $name, string $type = 'expense'): ParentCategory
    {
        return ParentCategory::create([
            'user_id' => $this->user->id,
            'name' => $name,
            'color' => '#112233',
            'icon' => 'faTag',
            'type' => $type,
            'enabled' => 1,
            'position' => 0,
        ]);
    }

    private function recordIn(ParentCategory $parent, string $type, float $amount): Record
    {
        $category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Child of ' . $parent->name,
            'icon' => 'faTag',
            'parent_category_id' => $parent->id,
            'enabled' => 1,
            'position' => 0,
        ]);

        return Record::create([
            'user_id' => $this->user->id,
            'date' => date('Y-m-d'),
            'from_account_id' => $this->account->id,
            'to_account_id' => null,
            'type' => $type,
            'category_id' => $category->id,
            'name' => 'Test ' . $type,
            'amount' => $amount,
            'rate' => 1,
        ]);
    }

    private function runMigration(): void
    {
        (require base_path(self::MIGRATION))->up();
    }

    /**
     * The reported case: an installation upgrading from an earlier version has
     * its income category on the default, because the previous migration only
     * recognised the English seeded name and the user had renamed it. The ids
     * the released code used (1 for transfers, 10 for incomes) are the ones to
     * mark, whatever those categories are called now.
     */
    public function testMarksTheLegacyIncomeAndTransferParents(): void
    {
        // Reproduce the two legacy rows, freeing their ids first: a primary key
        // cannot be reused while another row holds it.
        $children = DB::table('categories')->whereIn('parent_category_id', [1, 10])->pluck('id');
        DB::table('records')->whereIn('category_id', $children)->delete();
        DB::table('categories')->whereIn('parent_category_id', [1, 10])->delete();
        DB::table('parent_categories')->whereIn('id', [1, 10])->delete();

        $transfer = $this->parent('Transferencias');
        $income = $this->parent('Ingresos');

        DB::table('parent_categories')->where('id', $transfer->id)->update(['id' => 1]);
        DB::table('parent_categories')->where('id', $income->id)->update(['id' => 10]);

        $this->runMigration();

        $this->assertSame('transfer', DB::table('parent_categories')->where('id', 1)->value('type'));
        $this->assertSame('income', DB::table('parent_categories')->where('id', 10)->value('type'));
    }

    /**
     * The legacy ids only exist for the first user of an installation. Any other
     * user has their own categories with their own ids, so their income category
     * is recognised from the records inside it.
     */
    public function testMarksTheIncomeCategoryOfAnotherUserFromItsRecords(): void
    {
        $parent = $this->parent('Ingresos de mi cuenta');

        if (in_array($parent->id, [1, 10], true)) {
            $this->markTestSkipped('The legacy ids are taken by the other test in this class.');
        }

        $this->recordIn($parent, 'income', 1500);
        $this->recordIn($parent, 'income', 300);

        $this->runMigration();

        $this->assertSame('income', $parent->fresh()->type);
    }

    /**
     * A refund (an income record inside an expense category) does not turn the
     * category around: the majority of its records still decide.
     */
    public function testRefundsDoNotTurnAnExpenseCategoryIntoIncome(): void
    {
        $parent = $this->parent('Groceries');

        if (in_array($parent->id, [1, 10], true)) {
            $this->markTestSkipped('The legacy ids are taken by the other test in this class.');
        }

        $this->recordIn($parent, 'expense', -120);
        $this->recordIn($parent, 'expense', -80);
        $this->recordIn($parent, 'income', 15);

        $this->runMigration();

        $this->assertSame('expense', $parent->fresh()->type);
    }

    /**
     * A type set by hand is never overridden, not even when the records would
     * suggest otherwise.
     */
    public function testDoesNotTouchACategoryTypedByHand(): void
    {
        $parent = $this->parent('Mis ingresos', 'income');

        if (in_array($parent->id, [1, 10], true)) {
            $this->markTestSkipped('The legacy ids are taken by the other test in this class.');
        }

        $this->recordIn($parent, 'expense', -50);

        $this->runMigration();

        $this->assertSame('income', $parent->fresh()->type);
    }
}
