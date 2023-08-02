<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use App\Models\Account;
use DateTime;
use DateInterval;
use App\Models\Category;
use Illuminate\Support\Carbon;

class BalanceController extends Controller
{

    const CATEGORY_PARENT_ID_TRANSFER = 1;
    const CATEGORY_PARENT_ID_INCOME = 10;

    public function getBalance(Request $request)
    {
        $query = Account::where('user_id', $request->user()->id);
        if ($request->has('account_id')) {
            $query->where('id', $request->query('account_id'));
        }
        $accounts = $query->get();

        return response()->json([
            'amount' => round($accounts->sum('balance_base_currency'), 2),
            'currency_symbol' => $request->user()->currency_symbol
        ]);
    }

    public function getAll(Request $request)
    {
        $query = Record::filterByRequest($request);
        $queryIncome = clone $query;
        $queryExpense = clone $query;

        $excludedCategoryIds = Category::where('parent_category_id', self::CATEGORY_PARENT_ID_INCOME)->pluck('id');

        return response()->json([
            'incomes' => $queryIncome->whereIn('category_id', $excludedCategoryIds)->whereNot('type', 'transfer')->get()->sum('amount_base_currency'),
            'expenses' => $queryExpense->whereNotIn('category_id', $excludedCategoryIds)->whereNot('type', 'transfer')->get()->sum('amount_base_currency'),
            'currency_symbol' => $request->user()->currency_symbol
        ]);
    }

    public function getExpensesBalance(Request $request)
    {
        return response()->json([
            'amount' => Record::filterByRequest($request)->where('type', 'expense')->get()->sum('amount_base_currency'),
            'currency_symbol' => $request->user()->currency_symbol
        ]);
    }

    public function getTimeline(Request $request)
    {
        $records = Record::filterByRequest($request)->orderBy('date')->get();
        $balance = Account::where('user_id', $request->user()->id)->get()->sum('initial_balance_base_currency');

        $currentYear = Carbon::now()->year;
        $startDate = new DateTime($records->first()->date ?? Carbon::create($currentYear, 1, 1)->startOfMonth()->toDateString());
        $endDate = new DateTime($records->last()->date ?? Carbon::now()->toDateString());

        $beforeRecords = Record::filterByRequest($request, ['from_date', 'to_date'])->where('date', '<', $startDate->format('Y-m-d'))->get();
        foreach ($beforeRecords as $record) {
            $balance += $record->amount_base_currency;
        }

        $data = [];

        foreach ($records as $record) {
            $date = (new DateTime($record->date))->format('Y-m-d');
            $balance += $record->amount_base_currency;
            $data[$date] = round($balance, 2);
        }

        while ($startDate <= $endDate) {
            $formattedDate = $startDate->format('Y-m-d');
            $balance = $data[$formattedDate] ?? $balance;
            $data[$formattedDate] = round($balance, 2);

            $startDate->add(new DateInterval('P1D'));
        }

        ksort($data);

        return response()->json($data);
    }

    public function getByIncomeCategories(Request $request)
    {
        $incomeCategories = Category::where('parent_category_id', self::CATEGORY_PARENT_ID_INCOME)->pluck('id');
        $records = Record::filterByRequest($request)->whereIn('category_id', $incomeCategories)->orderBy('date')->get();

        $data = [];

        foreach ($records as $record) {
            $childKey = $record->category_name;
            $data[$childKey]['amount'] ??= 0;

            $amount = round($record->amount_base_currency, 2);

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
        $expenseCategories = Category::whereNotIn('parent_category_id', [self::CATEGORY_PARENT_ID_TRANSFER, self::CATEGORY_PARENT_ID_INCOME])->pluck('id');
        $records = Record::filterByRequest($request)->whereIn('category_id', $expenseCategories)->orderBy('date')->get();

        $data = [];

        foreach ($records as $record) {

            $parentKey = $record->parent_category_name;
            $childKey = $record->category_name;

            $data[$parentKey]['amount'] ??= 0;
            $data[$parentKey]['childrens'][$childKey] ??= 0;

            $amount = round(-$record->amount_base_currency, 2);

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
        $records = Record::filterByRequest($request)->whereNot('type', 'transfer')->get();

        $data = [];
        foreach ($records as $record) {
            $categoryType = ($record->parent_category_id === self::CATEGORY_PARENT_ID_INCOME) ? 'income' : 'expense';
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

            $data[$categoryType][$record->parent_category_id]['total'] += $record->amount_base_currency;
            $data[$categoryType][$record->parent_category_id]['childrens'][$record->category_id]['total'] += $record->amount_base_currency;
        }

        asort($data);

        return response()->json($data);
    }

    public function getTopExpenses(Request $request)
    {
        $query = Record::filterByRequest($request)->whereNot('type', 'transfer');

        $data = $query->select('category_id')
            ->groupBy('category_id')
            ->get()
            ->map(function ($item) {
                $category = Category::find($item->category_id);
                $records = Record::where('category_id', $item->category_id)
                    ->whereNot('type', 'transfer')
                    ->get();
                    
                $totalAmount = $records->sum(function ($record) {
                    return -$record->amount_base_currency;
                });

                return [
                    'name' => $category->name,
                    'amount' => $totalAmount,
                    'color' => $category->color,
                    'icon' => $category->icon,
                ];
            })
            ->sortByDesc('amount')
            ->take(3)
            ->values();

        return response()->json($data);
    }
}
