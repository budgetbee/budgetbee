<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;
use App\Models\AccountTypes;
use App\Models\Record;
use App\Models\Category;
use App\Models\Stock;

class AccountController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function get()
    {
        $accounts = Account::all();

        return response()->json($accounts);
    }

    public function getById($id)
    {
        $account = Account::find($id);

        return response()->json($account);
    }

    public function create(Request $request)
    {
        $this->validate($request, [
            'name' => 'required',
            'type_id' => 'required|integer',
            'color' => 'required',
            'initial_balance' => 'required'
        ]);

        $data = $request->only('name', 'type_id', 'color', 'initial_balance');

        $data['user_id'] = $request->user()->id;

        $account = new Account();
        $account->fill($data);
        $account->save();

        return response()->json($account);
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'name' => 'required',
            'type_id' => 'required|integer',
            'color' => 'required',
            "initial_balance" => 'required'
        ]);

        $data = $request->only('name', 'type_id', 'color', 'initial_balance');

        $account = Account::find($id);
        $account->fill($data);
        $account->save();
        
        $data = $request->toArray();

        $stocks = array_filter($data, function ($key) {
            return strpos($key, 'stock_') === 0;
        }, ARRAY_FILTER_USE_KEY);

        $alreadyStocks = [];
        $newStocks = [];
        foreach ($stocks as $key => $value) {
            $params = explode('_', $key);
            if (substr($key, -4) === '_new') {
                $newStocks[$params[2]][$params[1]] = $value;
            } else {
                $alreadyStocks[$params[2]][$params[1]] = $value;
            }
        }
        $newStocks = array_values($newStocks);

        foreach ($alreadyStocks as $k => $value) {
            $stock = Stock::find($k);
            $stock->fill([
                'account_id' => $account->id,
                'ticker' => strtoupper($value['ticker']),
                'total' => $value['total']
            ]);
            $stock->save();
        }

        foreach ($newStocks as $k => $value) {
            if ($value['ticker'] == '' || $value['total'] == '') {
                continue;
            }
            $stock = new Stock();
            $stock->fill([
                'account_id' => $account->id,
                'ticker' => strtoupper($value['ticker']),
                'total' => $value['total']
            ]);
            $stock->save();
        }

        return response()->json($account);
    }

    public function delete($id)
    {
        $account = Account::find($id);
        if (is_object($account)) {
            $account->delete();
        }

        return response()->json([]);
    }

    public function getTypes()
    {
        $types = AccountTypes::all();

        return response()->json($types);
    }

    public function getStocks($id)
    {
        $stocks = Stock::where('account_id', $id)->get();

        return response()->json($stocks);
    }

    public function getRecords($id)
    {
        $records = Record::where('from_account_id', $id)->get();

        return response()->json($records);
    }

    public function getLastRecords($id, $number)
    {
        $record = Record::where('from_account_id', $id)
            ->orderByDesc('date')
            ->limit($number)
            ->get();

        return response()->json($record);
    }

    public function adjustBalance(Request $request, $id)
    {
        $this->validate($request, [
            'balance' => 'required'
        ]);

        $data = $request->only('balance');

        $account = Account::find($id);

        $amount = $data['balance'] - $account->balance;
        $type = ($amount > 0) ? 'income' : 'expense';
        $unknownCategory = Category::where('name', '=', 'Desconocido')->first()->id;

        $newRecord = new Record();
        $newRecord->fill([
            'date' => date('Y-m-d'),
            'from_account_id' => $account->id,
            'amount' => $amount,
            'type' => $type,
            'name' => 'Ajuste',
            'category_id' => $unknownCategory
        ]);
        $newRecord->save();

        return response()->json();
    }
}
