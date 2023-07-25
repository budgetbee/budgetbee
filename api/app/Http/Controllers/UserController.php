<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function get(Request $request, $id = null)
    {
        if ($id) {
            $user = User::find($id);
        } else {
            $user = $request->user();
        }

        $this->authorize('view', $user);

        return response()->json($user);
    }

    public function getAll(Request $request)
    {
        $user = $request->user();
        
        if ($user->id == 1) {
            $users = User::all();
        }
        else {
            $users = User::where('id', $user->id)->get();
        }

        return response()->json($users);
    }

    public function checkIfAdmin() {
        $user = auth()->user();

        return response()->json(['is_admin' => $user->id === 1]);
    }

    public function getSettings() {
        $user = auth()->user();

        $settings = $user->getSettings();

        return response()->json($settings);
    }

    public function updateSettings(Request $request) {
        $user = auth()->user();

        $this->authorize('update', $user);

        $request->validate([
            'currency_id' => 'nullable|integer|exists:App\Models\Types\Currency,id'
        ]);

        $data = $request->only('currency_id');

        $user->update($data);

        return response()->json();
    }

    public function update(Request $request, $id)
    {

        $user = User::find($id);

        $this->authorize('update', $user);

        $request->validate([
            'name' => 'required|string',
            'email' => 'required|string|max:255|email',
            'password' => 'nullable|string|min:4',
            'confirm_password' => 'nullable|string|same:password',
            'currency_id' => 'nullable|integer|exists:App\Models\Types\Currency,id'
        ]);

        
        $data = $request->only('name', 'email', 'password', 'currency_id');

        if (empty($data['password'])) {
            unset($data['password']);
        }
        else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json();
    }
}
