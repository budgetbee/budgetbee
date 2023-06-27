<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Account;
use App\Models\AccountTypes;
use App\Models\Record;
use App\Models\Category;

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
            'user_id' => $request->user()->id,
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
