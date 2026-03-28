<?php

namespace App\Http\Controllers;

use App\Models\UpcomingExpense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class UpcomingExpenseController extends Controller
{
    public function getAll()
    {
        $data = UpcomingExpense::where('user_id', auth()->user()->id)
            ->orderBy('due_date', 'asc')
            ->get();

        return response()->json(['data' => $data]);
    }

    public function getById($id)
    {
        $upcomingExpense = UpcomingExpense::where('user_id', auth()->user()->id)
            ->find($id);

        if (!$upcomingExpense) {
            return response()->json(['message' => 'Upcoming expense not found'], 400);
        }

        $this->authorize('view', $upcomingExpense);

        return response()->json(['data' => $upcomingExpense]);
    }

    public function create(Request $request)
    {
        $messages = [
            'title.required' => 'The title is required',
            'category_id.required' => 'The category is required',
            'category_id.integer' => 'The category is not valid',
            'category_id.exists' => 'The category does not exist',
            'amount.required' => 'The amount is required',
            'amount.numeric' => 'The amount is not a valid number',
            'due_date.required' => 'The due date is required',
            'due_date.date' => 'The due date is not valid',
        ];

        try {
            Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'category_id' => 'required|integer|exists:App\Models\Category,id',
                'amount' => 'required|numeric',
                'due_date' => 'required|date',
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 400);
        }

        $data = $request->only('title', 'category_id', 'amount', 'due_date');
        $data['user_id'] = auth()->user()->id;

        $upcomingExpense = new UpcomingExpense();
        $upcomingExpense->fill($data);
        $upcomingExpense->save();

        return response()->json(['message' => 'Upcoming expense has been created successfully']);
    }

    public function update(Request $request, $id)
    {
        if (!is_numeric($id)) {
            return response()->json(['errors' => 'The upcoming expense id is not correct'], 400);
        }

        $upcomingExpense = UpcomingExpense::findOrFail($id);

        $this->authorize('update', $upcomingExpense);

        $messages = [
            'title.required' => 'The title is required',
            'category_id.required' => 'The category is required',
            'category_id.integer' => 'The category is not valid',
            'category_id.exists' => 'The category does not exist',
            'amount.required' => 'The amount is required',
            'amount.numeric' => 'The amount is not a valid number',
            'due_date.required' => 'The due date is required',
            'due_date.date' => 'The due date is not valid',
        ];

        try {
            Validator::make($request->all(), [
                'title' => 'required|string|max:255',
                'category_id' => 'required|integer|exists:App\Models\Category,id',
                'amount' => 'required|numeric',
                'due_date' => 'required|date',
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 400);
        }

        $data = $request->only('title', 'category_id', 'amount', 'due_date');

        $upcomingExpense->fill($data);
        $upcomingExpense->save();

        return response()->json(['message' => 'Upcoming expense has been updated successfully']);
    }

    public function delete($id)
    {
        $upcomingExpense = UpcomingExpense::where('user_id', auth()->id())
            ->find($id);

        if (!$upcomingExpense) {
            return response()->json(['message' => 'Upcoming expense not found'], 400);
        }

        $this->authorize('delete', $upcomingExpense);

        $upcomingExpense->delete();

        return response()->json(['message' => 'Upcoming expense deleted']);
    }
}
