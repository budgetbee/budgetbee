<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use App\Models\Account;
use DateTime;
use DateInterval;

class BalanceController extends Controller
{

    public function getBalance(Request $request)
    {
        $accounts = Account::where('user_id', $request->user()->id)->get();
        $balance = round($accounts->sum('balance'), 2);

        return response()->json($balance);
    }

    public function getBalanceByAccount(Request $request, $id)
    {
        $balance = Account::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first()
            ->balance;

        return response()->json(round($balance, 2));
    }

    public function getExpensesBalance(Request $request)
    {
        $records = Record::orderBy('date')
            ->where('type', 'expense')
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        $balance = 0;
        foreach ($records as $record) {
            $balance += $record->amount;
        }

        return response()->json($balance);
    }

    public function getExpensesBalanceByAccount(Request $request, $id)
    {
        $records = Record::orderBy('date')
            ->where('type', 'expense')
            ->where('from_account_id', $id)
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        $balance = 0;
        foreach ($records as $record) {
            $balance += $record->amount;
        }

        return response()->json($balance);
    }

    public function getTimeline(Request $request)
    {
        $startDate = $request->query->get('from') ?? date('Y') . "-01-01";
        $startDate = new DateTime($startDate);
        $endDate = new DateTime(date('Y-m-d'));

        $records = Record::where('user_id', $request->user()->id)
            ->orderBy('date')
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


    public function getTimelineByAccount(Request $request, $id)
    {
        $startDate = $request->query->get('from') ?? date('Y') . "-01-01";
        $startDate = new DateTime($startDate);
        $endDate = new DateTime(date('Y-m-d'));

        $records = Record::where('from_account_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderBy('date')
            ->get();

        $initialBalance = Account::where('id', $id)->where('user_id', $request->user()->id)->first()->initial_balance;
        $balance = $initialBalance;

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


    public function getByCategories(Request $request)
    {
        $records = Record::orderBy('date')
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

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

    public function getByCategoriesAndAccount(Request $request, $id)
    {
        $records = Record::where('from_account_id', $id)
            ->where('user_id', $request->user()->id);
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->orderBy('date')->get();

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
        $records = Record::whereNot('type', 'transfer')
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
}
