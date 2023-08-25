<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use DateTime;

class RecordController extends Controller
{

    public function get(Request $request)
    {
        $records = Record::where('user_id', $request->user()->id);

        $page = $request->query('page');
        if ($page > 0) {
            $perPage = 20;
            $records->skip(($page - 1) * $perPage)
                ->take($perPage);
        }

        $data = $records->orderByDesc('date')
            ->get();

        return response()->json($data);
    }

    public function getById($id)
    {
        $record = Record::where('id', $id)->first();

        $this->authorize('view', $record);

        return response()->json($record);
    }

    public function create(Request $request)
    {
        $this->validate($request, [
            'date' => 'required|date',
            'from_account_id' => 'required|integer|exists:App\Models\Account,id',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'category_id' => 'integer|exists:App\Models\Category,id',
            'name' => 'nullable|string',
            'type' => 'required|string',
            'amount' => 'required|numeric',
            'rate' => 'nullable|numeric',
            'code' => 'nullable|string',
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate', 'code');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
                'rate' => 'required'
            ]);
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $data['category_id'] = $data['category_id'] ?? 1;
        $data['user_id'] = $request->user()->id;

        $record = new Record();
        $record->fill($data);
        $record->save();

        return response()->json(['id' => $record->id]);
    }

    public function update(Request $request, $id)
    {
        $record = Record::find($id);

        $this->authorize('update', $record);

        $this->validate($request, [
            'date' => 'required',
            'from_account_id' => 'required',
            'to_account_id' => 'integer|exists:App\Models\Account,id',
            'type' => 'required',
            'amount' => 'required',
            'rate' => 'nullable|numeric'
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description', 'rate');

        if ($data['type'] === 'transfer') {
            $this->validate($request, [
                'to_account_id' => 'required',
                'rate' => 'required'
            ]);
        }

        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }

        $record->fill($data);
        $record->save();

        return response()->json($record);
    }

    public function delete($id)
    {
        $record = Record::find($id);

        $this->authorize('delete', $record);

        $record->delete();

        return response()->json([]);
    }

    public function getLastRecords(Request $request)
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
        if ($request->has('limit')) {
            $query->limit($request->query('limit'));
        }

        $records = $query->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json($records);
    }

    public function getRecordsByCategory(Request $request, $id)
    {
        $records = Record::where('category_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderByDesc('date')
            ->orderByDesc('id');
        $records = $request->query->get('from') ? $records->where('date', '>=', (new DateTime($request->query->get('from')))->format('Y-m-d')) : $records;
        $records = $records->get();

        return response()->json($records);
    }
}
