<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Loan;
use App\Models\LoanPayment;
use App\Models\Record;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class LoanController extends Controller
{
    public function getAll()
    {
        $loans = Loan::where('user_id', auth()->user()->id)
            ->with(['account', 'category'])
            ->withCount('payments')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json(['data' => $loans]);
    }

    public function getById($id)
    {
        if (!is_numeric($id)) {
            return response()->json(['errors' => 'The loan id is not correct'], 400);
        }

        $loan = Loan::where('user_id', auth()->user()->id)
            ->with(['account', 'category', 'payments' => function ($query) {
                $query->orderBy('payment_date', 'desc')->orderBy('id', 'desc');
            }])
            ->find($id);

        if (!$loan) {
            return response()->json(['message' => 'Loan not found'], 400);
        }

        return response()->json(['data' => $loan]);
    }

    public function create(Request $request)
    {
        $messages = [
            'name.required' => 'The name is required',
            'direction.in' => 'The direction must be "owed" or "receivable"',
            'total_amount.required' => 'The total amount is required',
            'total_amount.numeric' => 'The total amount is not valid',
        ];

        try {
            Validator::make($request->all(), [
                'name' => 'required|string|max:191',
                'direction' => 'required|string|in:' . implode(',', Loan::DIRECTIONS),
                'total_amount' => 'required|numeric|gt:0',
                'account_id' => 'nullable|integer|exists:App\Models\Account,id',
                'category_id' => 'nullable|integer|exists:App\Models\Category,id',
                'start_date' => 'nullable|date',
                'notes' => 'nullable|string|max:1000',
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 400);
        }

        // The account must belong to the authenticated user.
        if ($request->filled('account_id')) {
            $account = Account::where('user_id', auth()->id())
                ->find($request->input('account_id'));
            if (!$account) {
                return response()->json(['errors' => ['account_id' => ['The account does not exist']]], 400);
            }
        }

        $data = $request->only('name', 'direction', 'total_amount', 'account_id', 'category_id', 'start_date', 'notes');
        $data['user_id'] = auth()->user()->id;

        $loan = new Loan();
        $loan->fill($data);
        $loan->save();

        return response()->json(['message' => 'Loan has been created successfully', 'id' => $loan->id]);
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['errors' => 'The loan id is not correct'], 400);
        }

        $loan = Loan::where('user_id', auth()->user()->id)->find($id);
        if (!$loan) {
            return response()->json(['message' => 'Loan not found'], 400);
        }

        $messages = [
            'name.required' => 'The name is required',
            'direction.in' => 'The direction must be "owed" or "receivable"',
            'total_amount.required' => 'The total amount is required',
        ];

        try {
            Validator::make($request->all(), [
                'name' => 'sometimes|required|string|max:191',
                'direction' => 'sometimes|required|string|in:' . implode(',', Loan::DIRECTIONS),
                'total_amount' => 'sometimes|required|numeric|gt:0',
                'account_id' => 'nullable|integer|exists:App\Models\Account,id',
                'category_id' => 'nullable|integer|exists:App\Models\Category,id',
                'start_date' => 'nullable|date',
                'notes' => 'nullable|string|max:1000',
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 400);
        }

        if ($request->filled('account_id')) {
            $account = Account::where('user_id', auth()->id())
                ->find($request->input('account_id'));
            if (!$account) {
                return response()->json(['errors' => ['account_id' => ['The account does not exist']]], 400);
            }
        }

        $data = $request->only('name', 'direction', 'total_amount', 'account_id', 'category_id', 'start_date', 'notes');
        $loan->fill($data);
        $loan->save();

        return response()->json(['message' => 'Loan has been updated successfully']);
    }

    public function delete($id)
    {
        $loan = Loan::where('user_id', auth()->id())->find($id);

        if (!$loan) {
            return response()->json(['message' => 'Loan not found'], 400);
        }

        // Payments are removed with the loan; the Records they generated are
        // real financial history and stay untouched (soft-deleting the loan
        // does not trigger the DB cascade, so remove payments explicitly).
        $loan->payments()->delete();
        $loan->delete();

        return response()->json(['message' => 'Loan has been deleted successfully']);
    }

    /**
     * Resolve the category for the auto-generated record: the loan's own
     * category when set, otherwise the user's first category (never a global
     * id that could belong to another user).
     */
    private function resolveCategoryId(Loan $loan): int
    {
        if ($loan->category_id) {
            return $loan->category_id;
        }

        $category = \App\Models\Category::where('user_id', $loan->user_id)
            ->orderBy('id')
            ->value('id');

        if (!$category) {
            throw new \RuntimeException('No category available for the loan record');
        }

        return $category;
    }

    /**
     * Register a payment against a loan.
     *
     * Creates the LoanPayment and, when the loan has an account (or one is
     * provided), also creates the matching Record (expense for "owed" loans,
     * income for "receivable" ones) so balances/reports stay in sync.
     */
    public function storePayment(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['errors' => 'The loan id is not correct'], 400);
        }

        $loan = Loan::where('user_id', auth()->user()->id)->find($id);

        if (!$loan) {
            return response()->json(['message' => 'Loan not found'], 400);
        }

        $messages = [
            'amount.required' => 'The amount is required',
            'amount.numeric' => 'The amount is not valid',
            'payment_date.required' => 'The payment date is required',
            'payment_date.date' => 'The payment date is not valid',
        ];

        try {
            Validator::make($request->all(), [
                'amount' => 'required|numeric|gt:0',
                'payment_date' => 'required|date',
                'account_id' => 'nullable|integer|exists:App\Models\Account,id',
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 400);
        }

        $accountId = $request->input('account_id', $loan->account_id);

        // Cannot create the financial record without an account — require one
        // up front so payments never silently lose their accounting trail.
        if (!$accountId) {
            return response()->json([
                'errors' => ['account_id' => ['This loan has no account. Edit the loan to set an account, or pass one with the payment.']],
            ], 400);
        }

        $account = Account::where('user_id', auth()->id())->find($accountId);
        if (!$account) {
            return response()->json(['errors' => ['account_id' => ['The account does not exist']]], 400);
        }

        // Allow flexible instalments, but never more than what is still owed.
        $amount = round(abs((float) $request->input('amount')), 2);
        $remaining = round((float) $loan->total_amount - (float) $loan->total_paid, 2);
        if ($amount > $remaining) {
            return response()->json([
                'errors' => ['amount' => ['The amount exceeds the remaining balance of ' . number_format($remaining, 2) . '.']],
            ], 400);
        }

        try {
            $record = DB::transaction(function () use ($request, $loan, $accountId) {
                $amount = abs((float) $request->input('amount'));
                $paymentDate = $request->input('payment_date');

                $record = new Record();
                $record->fill([
                    'user_id' => $loan->user_id,
                    'date' => $paymentDate . ' 00:00:00',
                    'from_account_id' => $accountId,
                    'type' => $loan->direction === 'owed' ? 'expense' : 'income',
                    'category_id' => $this->resolveCategoryId($loan),
                    'name' => 'Loan: ' . $loan->name,
                    'amount' => $loan->direction === 'owed' ? -$amount : $amount,
                ]);
                $record->save();

                $payment = new LoanPayment();
                $payment->fill([
                    'loan_id' => $loan->id,
                    'record_id' => $record->id,
                    'amount' => $amount,
                    'payment_date' => $paymentDate,
                ]);
                $payment->save();

                return $record;
            });
        } catch (\Exception $e) {
            return response()->json(['errors' => ['payment' => ['Could not register the payment: ' . $e->getMessage()]]], 500);
        }

        return response()->json([
            'message' => 'Payment has been registered successfully',
            'record_id' => $record->id,
        ]);
    }
}
