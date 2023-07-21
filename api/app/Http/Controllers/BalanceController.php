<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use App\Models\Account;
use DateTime;
use DateInterval;
use Illuminate\Support\Facades\DB;
use App\Models\Category;

class BalanceController extends Controller
{

    public function getBalance(Request $request)
    {
        $query = Account::where('user_id', $request->user()->id);
        if ($request->has('account_id')) {
            $query->where('id', $request->query('account_id'));
        }
        $accounts = $query->get();
        $balance = round($accounts->sum('balance'), 2);

        return response()->json($balance);
    }

    public function getAll(Request $request)
    {
        $query = Record::query()
            ->where('user_id', $request->user()->id);

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

        $records = $query->get();

        $data = $records->reduce(function ($carry, $record) {
            if ($record->type !== 'expenses') {
                if ($record->parent_category_id == 10) {
                    $carry['incomes'] += $record->amount;
                } else {
                    $carry['expenses'] += $record->amount;
                }
            }
            $carry['balance'] += $record->amount;
            return $carry;
        }, ['balance' => 0, 'incomes' => 0, 'expenses' => 0]);

        return response()->json($data);
    }

    public function getExpensesBalance(Request $request)
    {
        $query = Record::query()
            ->where('type', 'expense')
            ->where('user_id', $request->user()->id);

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

        $records = $query->get();

        $balance = $records->sum('amount');

        return response()->json($balance);
    }

    public function getTimeline(Request $request)
    {
        $startDate = new DateTime(date('Y') . "-01-01");
        $endDate = new DateTime(date('Y-m-d'));

        $query = Record::where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
            $startDate = new DateTime($request->query('from_date'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
            $endDate = new DateTime($request->query('to_date'));
        }

        $records = $query->orderBy('date')
            ->get();

        $accounts = Account::where('user_id', $request->user()->id)->get();
        $initialBalance = $accounts->sum('initial_balance');
        $balance = $initialBalance;

        $data = [];

        $balanceByDate = [];
        foreach ($records as $record) {
            $date = (new DateTime($record->date))->format('Y-m-d');
            $balance += $record->amount;
            $balanceByDate[$date] = $balance;
        }

        $closestDate = null;
        $closestValue = null;

        foreach ($balanceByDate as $arrayDate => $value) {
            if ($arrayDate <= $startDate->format('Y-m-d') && ($closestDate === null || $arrayDate > $closestDate)) {
                $closestDate = $arrayDate;
                $closestValue = $value;
            }
        }

        $balance = $closestValue ?? $initialBalance;
        $data = [];

        while ($startDate <= $endDate) {
            $formattedDate = $startDate->format('Y-m-d');
            $balance = $balanceByDate[$formattedDate] ?? $balance;
            $data[$formattedDate] = round($balance, 2);

            $startDate->add(new DateInterval('P1D'));
        }

        return response()->json($data);
    }

    public function getByIncomeCategories(Request $request)
    {
        $query = Record::orderBy('date')
            ->where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }

        $records = $query->get();

        $data = [];

        foreach ($records as $record) {
            if ($record->parent_category_id != 10) {
                continue;
            }

            $childKey = $record->category_name;
            $data[$childKey]['amount'] ??= 0;

            $amount = round($record->amount, 2);

            $data[$childKey]['amount'] += $amount;
        }

        uasort($data, function ($a, $b) {
            return $b['amount'] - $a['amount'];
        });

        $originalGreen = [38, 255, 12];
        foreach ($data as &$row) {
            $reducedGreen = [max(0, $originalGreen[0] - 25), max(0, $originalGreen[1] - 25), max(0, $originalGreen[2] - 25)];
            $row['color'] = "rgb(" . implode(',', $reducedGreen) . ")";
            $originalGreen = $reducedGreen;
        }

        return response()->json($data);
    }

    public function getByExpenseCategories(Request $request)
    {
        $query = Record::orderBy('date')
            ->where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }

        $records = $query->get();

        $data = [];

        $parentCategoriesToOmmit = [1, 10];

        foreach ($records as $record) {
            if (in_array($record->parent_category_id, $parentCategoriesToOmmit)) {
                continue;
            }
            $parentKey = $record->parent_category_name;
            $childKey = $record->category_name;

            $data[$parentKey]['amount'] ??= 0;
            $data[$parentKey]['childrens'][$childKey] ??= 0;

            $amount = round(-$record->amount, 2);

            $data[$parentKey]['id'] = $record->parent_category_id;
            $data[$parentKey]['color'] = $record->category_color;
            $data[$parentKey]['amount'] += $amount;
            $data[$parentKey]['childrens'][$childKey] += $amount;
        }

        foreach ($data as $parentKey => $category) {
            if ($category['amount'] < 0) {
                unset($data[$parentKey]);
            }
        }

        uasort($data, function ($a, $b) {
            return $b['amount'] - $a['amount'];
        });

        return response()->json($data);
    }

    public function getBySubcategories(Request $request, $id)
    {
        $records = Record::orderBy('date')
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        $data = [];

        $parentCategoriesToOmmit = [1, 10];

        foreach ($records as $record) {
            if (in_array($record->parent_category_id, $parentCategoriesToOmmit) || $record->parent_category_id != $id) {
                continue;
            }
            $categoryId = $record->category_name;
            $data[$categoryId]['amount'] ??= 0;

            $amount = round(-$record->amount, 2);

            $data[$categoryId]['icon'] = $record->icon;
            $data[$categoryId]['color'] = $record->category_color;
            $data[$categoryId]['amount'] += $amount;
        }

        foreach ($data as $categoryId => $category) {
            if ($category['amount'] < 0) {
                unset($data[$categoryId]);
            }
        }

        uasort($data, function ($a, $b) {
            return $b['amount'] - $a['amount'];
        });

        return response()->json($data);
    }

    public function getBySubcategoriesAndAccount(Request $request, $id, $accountId)
    {
        $records = Record::where('from_account_id', $accountId)
            ->where('user_id', $request->user()->id)
            ->orderBy('date');
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        $data = [];

        $parentCategoriesToOmmit = [1, 10];

        foreach ($records as $record) {
            if (in_array($record->parent_category_id, $parentCategoriesToOmmit) || $record->parent_category_id != $id) {
                continue;
            }
            $categoryId = $record->category_name;
            $data[$categoryId]['amount'] ??= 0;

            $amount = round(-$record->amount, 2);

            $data[$categoryId]['icon'] = $record->icon;
            $data[$categoryId]['color'] = $record->category_color;
            $data[$categoryId]['amount'] += $amount;
        }

        foreach ($data as $categoryId => $category) {
            if ($category['amount'] < 0) {
                unset($data[$categoryId]);
            }
        }

        uasort($data, function ($a, $b) {
            return $b['amount'] - $a['amount'];
        });

        return response()->json($data);
    }

    public function getBalanceByCategory(Request $request)
    {
        $query = Record::whereNot('type', 'transfer')
            ->where('user_id', $request->user()->id);

        if ($request->has('account_id')) {
            $query->where('from_account_id', $request->query('account_id'));
        }
        if ($request->has('from_date')) {
            $query->where('date', '>=', (new DateTime($request->query('from_date')))->format('Y-m-d'));
        }
        if ($request->has('to_date')) {
            $query->where('date', '<=', (new DateTime($request->query('to_date')))->format('Y-m-d'));
        }

        $records = $query->get();

        $data = [];
        foreach ($records as $record) {
            $categoryType = ($record->parent_category_id == 10) ? 'income' : 'expense';
            if (!isset($data[$categoryType][$record->parent_category_id])) {
                $data[$categoryType][$record->parent_category_id] = [
                    'id' => $record->parent_category_id,
                    'name' => $record->parent_category_name,
                    'icon' => $record->parent_category_icon,
                    'color' => $record->category_color,
                    'total' => 0,
                    'childrens' => []
                ];
            }

            if (!isset($data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id])) {
                $data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id] = [
                    'id' => $record->category_id,
                    'name' => $record->category_name,
                    'icon' => $record->parent_category_icon,
                    'color' => $record->category_color,
                    'total' => 0
                ];
            }

            if ($categoryType == "expense") {
                asort($data[$categoryType]);
                asort($data[$categoryType][$record->parent_category_id]['childrens']);
            }

            $data[$categoryType][$record->parent_category_id]['total'] += $record->amount;
            $data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id]['total'] += $record->amount;
        }

        asort($data);

        return response()->json($data);
    }

    public function getBalanceByCategoryAndAccount(Request $request, $id)
    {
        $records = Record::where('from_account_id', $id)
            ->whereNot('type', 'transfer')
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        $data = [];
        foreach ($records as $record) {
            $categoryType = ($record->parent_category_id == 10) ? 'income' : 'expense';
            if (!isset($data[$categoryType][$record->parent_category_id])) {
                $data[$categoryType][$record->parent_category_id] = [
                    'id' => $record->parent_category_id,
                    'name' => $record->parent_category_name,
                    'icon' => $record->parent_category_icon,
                    'color' => $record->category_color,
                    'total' => 0,
                    'childrens' => []
                ];
            }

            if (!isset($data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id])) {
                $data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id] = [
                    'id' => $record->category_id,
                    'name' => $record->category_name,
                    'icon' => $record->parent_category_icon,
                    'color' => $record->category_color,
                    'total' => 0
                ];
            }

            if ($categoryType == "expense") {
                asort($data[$categoryType]);
                asort($data[$categoryType][$record->parent_category_id]['childrens']);
            }

            $data[$categoryType][$record->parent_category_id]['total'] += $record->amount;
            $data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id]['total'] += $record->amount;
        }

        asort($data);

        return response()->json($data);
    }

    public function getTopExpenses(Request $request)
    {
        $query = Record::query()
            ->where('user_id', $request->user()->id)
            ->where('type', 'expense');

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


        $data = $query->select('category_id', DB::raw('SUM(ABS(amount)) as total_amount'))
            ->groupBy('category_id')
            ->orderByDesc('total_amount')
            ->take(3)
            ->get()
            ->map(function ($item) {
                $category = Category::find($item->category_id);
                return [
                    'name' => $category->name,
                    'amount' => $item->total_amount,
                    'color' => $category->color,
                    'icon' => $category->icon,
                ];
            });

        return response()->json($data);
    }
}
