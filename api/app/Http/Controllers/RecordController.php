<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Record;
use DateTime;
use Illuminate\Support\Facades\Log;

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
        ]);

        $data = $request->only('date', 'from_account_id', 'to_account_id', 'type', 'category_id', 'name', 'amount', 'description');
        
        $data['amount'] = abs($data['amount']);
        if ($data['type'] == "expense" || $data['type'] == "transfer") {
            $data['amount'] = "-" . $data['amount'];
        }
        
        $data['category_id'] = $data['category_id'] ?? 1;
        $data['user_id'] = $request->user()->id;
        
        $record = new Record();
        $record->fill($data);
        $record->save();
        if ($record->type == "transfer") {
            $record->createUpdateTransferRecord();
        }

        return response()->json(['id' => $record->id]);
    }

    public function update(Request $request, $id)
    {
        $record = Record::find($id);

        $this->authorize('update', $record);

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
        
        $record->fill($data);
        $record->save();
        if ($record->type == "transfer") {
            $record->createUpdateTransferRecord();
        }

        return response()->json($record);
    }

    public function delete($id)
    {
        $record = Record::find($id);
        
        $this->authorize('delete', $record);
        
        $record->delete();
        Log::info('Delete record', $record->toArray());

        return response()->json([]);
    }

    public function getLastRecords(Request $request, $number)
    {
        $record = Record::where('user_id', $request->user()->id)
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit($number)
            ->get();

        return response()->json($record);
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
