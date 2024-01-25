<?php

namespace App\Http\Controllers;

use Exception;
use App\Models\Budget;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class BudgetController extends Controller
{
    public function getAll() {
        $data = Budget::where('user_id', auth()->user()->id)->get();

        return response()->json(['data' => $data]);
    }

    public function getById($id) {
        $budget = Budget::where('user_id', auth()->user()->id)
            ->find($id);

        if (!$budget) {
            return response()->json(['message' => 'Budget not found'], 400);
        }

        $this->authorize('view', $budget);

        return response()->json(['data' => $budget]);
    }

    public function create(Request $request) {

        $messages = [
            'category_id.required' => 'The category is required',
            'category_id.integer' => 'The category is not valid',
            'category_id.exists' => 'The category does not exist',
            'amount.required' => 'The amount is required',
            'amount.numeric' => 'The amount is not a vali number'
        ];
        
        try {
            Validator::make($request->all(), [
                'category_id' => 'required|integer|exists:App\Models\Category,id',
                'amount' => 'required|numeric'
            ], $messages)->validate();
        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 400);
        }

        $data = $request->only('category_id', 'amount');
        $data['user_id'] = auth()->user()->id;

        $budget = new Budget();
        $budget->fill($data);
        $budget->save();

        return response()->json(['message' => 'Budget has been created successfully']);
    }

    public function update(Request $request, $id) {

        if (!is_numeric($id)) {
            return response()->json(['errors' => 'The budget id is not correct'], 400);
        }

        $budget = Budget::findOrFail($id);

        $this->authorize('update', $budget);

        $messages = [
            'category_id.required' => 'The category is required',
            'category_id.integer' => 'The category is not valid',
            'category_id.exists' => 'The category does not exist',
            'amount.required' => 'The amount is required',
            'amount.numeric' => 'The amount is not a vali number'
        ];

        try {
            Validator::make($request->all(), [
                'category_id' => 'required|integer|exists:App\Models\Category,id',
                'amount' => 'required|numeric'
            ], $messages)->validate();

        } catch (ValidationException $e) {
            return response()->json([
                'errors' => $e->errors()
            ], 400);
        }

        $data = $request->only('category_id', 'amount');

        

        $budget->fill($data);
        $budget->save();

        return response()->json(['message' => 'Budget has been updated successfully']);
    }

    public function delete($id) {
        $budget = Budget::where('user_id', auth()->id())
            ->find($id);

        if (!$budget) {
            return response()->json(['message' => 'Budget not found'], 400);
        }

        if (!Auth::check()) {
            dd('NOPE');
        }

        $this->authorize('delete', $budget);

        $budget->delete();

        return response()->json(['message' => 'Budget deleted']);
    }
}
