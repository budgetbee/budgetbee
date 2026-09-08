<?php

namespace Tests\Feature;

use App\Events\UserCreated;
use App\Models\Account;
use App\Models\AccountTypes;
use App\Models\Category;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\Record;
use App\Models\User;
use App\Models\UserCurrency;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanTest extends TestCase
{
    private $user;
    private $account;
    private $category;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        $this->actingAs($this->user);

        event(new UserCreated($this->user));

        // Create account data manually instead of via factories: factories
        // depend on AccountTypes/UserCurrency rows seeded by DatabaseSeeder,
        // which RefreshDatabase (migrate:fresh) wipes. The user already has a
        // default UserCurrency (created by UserCreated/AssignCategorySeeder).
        $type = AccountTypes::create(['name' => 'Bank']);
        $userCurrency = UserCurrency::where('user_id', $this->user->id)->firstOrFail();
        $this->account = Account::create([
            'user_id' => $this->user->id,
            'name' => 'Test Bank',
            'type_id' => $type->id,
            'currency_id' => $userCurrency->id,
            'color' => '#ff0000',
        ]);

        // First real category of the user (used for the auto-generated record).
        $this->category = Category::where('user_id', $this->user->id)->first();

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();

        parent::tearDown();
    }

    private function createLoan(array $overrides = []): Loan
    {
        return Loan::create(array_merge([
            'user_id' => $this->user->id,
            'name' => 'Car loan',
            'direction' => 'owed',
            'total_amount' => 1000,
            'account_id' => $this->account->id,
            'category_id' => $this->category->id,
            'start_date' => '2026-01-01',
        ], $overrides));
    }

    public function testCreateLoan(): void
    {
        $response = $this->post('/api/loan', [
            'name' => 'Car loan',
            'direction' => 'owed',
            'total_amount' => 1000,
            'account_id' => $this->account->id,
            'start_date' => '2026-01-01',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('loans', [
            'user_id' => $this->user->id,
            'name' => 'Car loan',
            'direction' => 'owed',
            'total_amount' => 1000,
        ]);
    }

    public function testCreateLoanValidatesDirection(): void
    {
        $response = $this->post('/api/loan', [
            'name' => 'Bad loan',
            'direction' => 'sideways',
            'total_amount' => 1000,
        ]);

        $response->assertStatus(400);
    }

    public function testCreateReceivableLoan(): void
    {
        $response = $this->post('/api/loan', [
            'name' => 'Car I sold to Juan',
            'direction' => 'receivable',
            'total_amount' => 3500,
            'account_id' => $this->account->id,
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('loans', [
            'user_id' => $this->user->id,
            'direction' => 'receivable',
            'total_amount' => 3500,
        ]);
    }

    public function testLoanComputedProgress(): void
    {
        $loan = $this->createLoan();

        $this->assertSame(0, $loan->progress);
        $this->assertSame(0.0, $loan->total_paid);
        $this->assertSame(1000.0, $loan->remaining);

        LoanPayment::create([
            'loan_id' => $loan->id,
            'amount' => 200,
            'payment_date' => '2026-02-01',
        ]);
        LoanPayment::create([
            'loan_id' => $loan->id,
            'amount' => 150,
            'payment_date' => '2026-03-01',
        ]);

        $loan->refresh();

        $this->assertSame(350.0, $loan->total_paid);
        $this->assertSame(650.0, $loan->remaining);
        $this->assertSame(35, $loan->progress);
    }

    public function testStorePaymentCreatesExpenseRecordForOwedLoan(): void
    {
        $loan = $this->createLoan();

        $response = $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 200,
            'payment_date' => '2026-02-01',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('loan_payments', [
            'loan_id' => $loan->id,
            'amount' => 200,
        ]);

        // A negative expense record must exist on the loan's account.
        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'from_account_id' => $this->account->id,
            'type' => 'expense',
            'name' => 'Loan: Car loan',
            'amount' => -200,
        ]);

        $loan->refresh();
        $this->assertSame(200.0, $loan->total_paid);
        $this->assertSame(800.0, $loan->remaining);
    }

    public function testStorePaymentCreatesIncomeRecordForReceivableLoan(): void
    {
        $loan = $this->createLoan([
            'name' => 'Car sold on credit',
            'direction' => 'receivable',
            'total_amount' => 3500,
        ]);

        $response = $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 500,
            'payment_date' => '2026-02-15',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('records', [
            'user_id' => $this->user->id,
            'type' => 'income',
            'name' => 'Loan: Car sold on credit',
            'amount' => 500,
        ]);

        $loan->refresh();
        $this->assertSame(500.0, $loan->total_paid);
    }

    public function testStorePaymentOverpayingIsBlocked(): void
    {
        // Payments beyond the total are nonsense for a loan tracker.
        $loan = $this->createLoan(['total_amount' => 100]);

        $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 60,
            'payment_date' => '2026-02-01',
        ])->assertStatus(200);

        $response = $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 60,
            'payment_date' => '2026-03-01',
        ]);

        $response->assertStatus(400);
    }

    public function testStorePaymentRequiresAccountOnLoan(): void
    {
        $loan = $this->createLoan(['account_id' => null]);

        $response = $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 50,
            'payment_date' => '2026-02-01',
        ]);

        $response->assertStatus(400);
    }

    public function testStorePaymentValidatesAmount(): void
    {
        $loan = $this->createLoan();

        $response = $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => -5,
            'payment_date' => '2026-02-01',
        ]);

        $response->assertStatus(400);
    }

    public function testUserCannotSeeOtherUsersLoans(): void
    {
        $otherUser = User::factory()->create(['password' => 'UserTest123']);
        event(new UserCreated($otherUser));
        $otherUserCurrency = UserCurrency::where('user_id', $otherUser->id)->firstOrFail();
        $otherType = AccountTypes::create(['name' => 'Bank']);
        $otherAccount = Account::create([
            'user_id' => $otherUser->id,
            'name' => 'Other Bank',
            'type_id' => $otherType->id,
            'currency_id' => $otherUserCurrency->id,
            'color' => '#00ff00',
        ]);

        $otherLoan = Loan::create([
            'user_id' => $otherUser->id,
            'name' => 'Car loan',
            'direction' => 'owed',
            'total_amount' => 1000,
            'account_id' => $otherAccount->id,
        ]);

        // As $this->user, trying to fetch the other user's loan must fail.
        $response = $this->get('/api/loan/' . $otherLoan->id);
        $response->assertStatus(400);

        // And the list only contains own loans.
        $this->createLoan(['name' => 'Mine']);
        $response = $this->get('/api/loan');
        $response->assertStatus(200);
        $response->assertJsonMissing(['name' => 'Car loan']); // the other user's
        $response->assertJsonFragment(['name' => 'Mine']);
    }

    public function testGetLoanIncludesPaymentsAndProgress(): void
    {
        $loan = $this->createLoan();

        $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 250,
            'payment_date' => '2026-02-01',
        ])->assertStatus(200);

        $response = $this->get('/api/loan/' . $loan->id);

        $response->assertStatus(200);
        $response->assertJsonFragment(['total_paid' => 250]);
        $response->assertJsonFragment(['remaining' => 750]);
        $response->assertJsonFragment(['progress' => 25]);
    }

    public function testDeleteLoanKeepsGeneratedRecords(): void
    {
        $loan = $this->createLoan();

        $this->post('/api/loan/' . $loan->id . '/payment', [
            'amount' => 100,
            'payment_date' => '2026-02-01',
        ])->assertStatus(200);

        $response = $this->delete('/api/loan/' . $loan->id);
        $response->assertStatus(200);

        // Soft-deleted: the row stays but with deleted_at set.
        $this->assertSoftDeleted('loans', ['id' => $loan->id]);
        // Payments cascade-delete with the loan...
        $this->assertDatabaseMissing('loan_payments', ['loan_id' => $loan->id]);
        // ...but the generated record stays (real financial history).
        $this->assertDatabaseHas('records', [
            'name' => 'Loan: Car loan',
            'amount' => -100,
        ]);
    }
}
