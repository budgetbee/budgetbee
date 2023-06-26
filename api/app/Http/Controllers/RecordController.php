<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use App\Models\Account;
use DateTime;

class RecordController extends Controller
{
    /**
     * Create a new controller instance.
     *
     * @return void
     */
    public function get()
    {
        $records = Record::orderByDesc('date')->get();

        return response()->json($records);
    }

    public function getById($id)
    {
        $record = Record::find($id);

        return response()->json($record);
    }

    public function create(Request $request)
    {

        $this->validate($request, [
            'date' => 'required',
            'from_account_id' => 'required',
            'type' => 'required',
            'amount' => 'required',
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description');

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $data['category_id'] = $data['category_id'] ?? 1;

        $record = new Record();
        $record->fill($data);
        $record->save();
        $record->updateAccounts();

        return response()->json(['id' => $record->id]);
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'date' => 'required',
            'from_account_id' => 'required',
            'type' => 'required',
            'amount' => 'required',
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description');

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $record = Record::find($id);
        $record->fill($data);
        $record->save();
        $record->updateAccounts();

        return response()->json($record);
    }

    public function delete($id)
    {
        $record = Record::find($id);
        $record->delete();

        return response()->json([]);
    }

    public function getLastRecords($number)
    {
        $record = Record::orderByDesc('date')
            ->orderByDesc('id')
            ->limit($number)
            ->get();

        return response()->json($record);
    }

    public function getRecordsByCategory(Request $request, $id)
    {
        $records = Record::where('category_id', $id)
            ->orderByDesc('date')
            ->orderByDesc('id');
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        return response()->json($records);
    }
}
