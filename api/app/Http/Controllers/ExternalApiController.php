<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\AccountTypes;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\Record;
use DateTime;
use Illuminate\Http\Request;

class ExternalApiController extends Controller
{
    // ---- Records CRUD ----

    public function getRecords(Request $request)
    {
        $query = Record::where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }
        if ($request->has('search_term')) {
            $query->where('name', 'like', '%' . $request->query('search_term') . '%');
        }
        if ($request->has('category_id')) {
            $query->where('category_id', $request->query('category_id'));
        }
        if ($request->has('type')) {
            $query->where('type', $request->query('type'));
        }

        $page = $request->query('page', 1);
        $perPage = $request->query('per_page', 20);
        $records = $query->orderByDesc('date')
            ->orderByDesc('id')
            ->paginate($perPage, ['*'], 'page', $page);

        return response()->json($records);
    }

    public function getRecord(Request $request, $id)
    {
        $record = Record::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        return response()->json($record);
    }

    public function createRecord(Request $request)
    {
        $this->validate($request, [
            'date' => 'required|date',
            'from_account_id' => 'required|integer|exists:App\Models\Account,id',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'category_id' => 'integer|exists:App\Models\Category,id',
            'name' => 'nullable|string',
            'type' => 'required|string|in:income,expense,transfer',
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric',
            'code' => 'nullable|string',
            'description' => 'nullable|string',
        ]);

        $account = Account::where('user_id', $request->user()->id)
            ->where('id', $request->input('from_account_id'))
            ->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found or does not belong to user'], 422);
        }

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate', 'code');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
                'rate' => 'required',
            ]);

            $toAccount = Account::where('user_id', $request->user()->id)
                ->where('id', $request->input('to_account_id'))
                ->first();

            if (!$toAccount) {
                return response()->json(['message' => 'Target account not found or does not belong to user'], 422);
            }
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] === 'expense' || $data['type'] === 'transfer') {
            $data['amount'] = -$data['amount'];
        }

        $data['category_id'] = $data['category_id'] ?? 1;
        $data['user_id'] = $request->user()->id;

        $record = new Record();
        $record->fill($data);
        $record->save();

        return response()->json(Record::find($record->id), 201);
    }

    public function updateRecord(Request $request, $id)
    {
        $record = Record::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        $this->validate($request, [
            'date' => 'required|date',
            'from_account_id' => 'required|integer|exists:App\Models\Account,id',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'type' => 'required|string|in:income,expense,transfer',
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric',
            'code' => 'nullable|string',
            'description' => 'nullable|string',
            'name' => 'nullable|string',
        ]);

        $account = Account::where('user_id', $request->user()->id)
            ->where('id', $request->input('from_account_id'))
            ->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found or does not belong to user'], 422);
        }

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
                'rate' => 'required',
            ]);

            $toAccount = Account::where('user_id', $request->user()->id)
                ->where('id', $request->input('to_account_id'))
                ->first();

            if (!$toAccount) {
                return response()->json(['message' => 'Target account not found or does not belong to user'], 422);
            }
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] === 'expense' || $data['type'] === 'transfer') {
            $data['amount'] = -$data['amount'];
        }

        $record->fill($data);
        $record->save();

        return response()->json(Record::find($record->id));
    }

    public function deleteRecord(Request $request, $id)
    {
        $record = Record::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$record) {
            return response()->json(['message' => 'Record not found'], 404);
        }

        $record->delete();

        return response()->json(['message' => 'Record deleted']);
    }

    // ---- Accounts (read-only) ----

    public function getAccounts(Request $request)
    {
        $accounts = Account::where('user_id', $request->user()->id)->get();

        return response()->json($accounts);
    }

    public function getAccount(Request $request, $id)
    {
        $account = Account::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$account) {
            return response()->json(['message' => 'Account not found'], 404);
        }

        return response()->json($account);
    }

    public function getAccountTypes()
    {
        return response()->json(AccountTypes::all());
    }

    // ---- Categories (read-only) ----

    public function getCategories(Request $request)
    {
        $categories = Category::where('user_id', $request->user()->id)->get();

        return response()->json($categories);
    }

    public function getCategory(Request $request, $id)
    {
        $category = Category::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        return response()->json($category);
    }

    public function getParentCategories(Request $request)
    {
        $parentCategories = ParentCategory::where('user_id', $request->user()->id)->get();

        return response()->json($parentCategories);
    }

    public function getParentCategory(Request $request, $id)
    {
        $parentCategory = ParentCategory::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$parentCategory) {
            return response()->json(['message' => 'Parent category not found'], 404);
        }

        return response()->json($parentCategory);
    }

    public function getCategoriesByParent(Request $request, $id)
    {
        $categories = Category::where('parent_category_id', $id)
            ->where('user_id', $request->user()->id)
            ->get();

        return response()->json($categories);
    }
}
