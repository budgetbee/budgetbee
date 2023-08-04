<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use App\Models\UserCurrency;
use Illuminate\Support\Facades\Auth;
use App\Models\Types\Currency;

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
        } else {
            $users = User::where('id', $user->id)->get();
        }

        return response()->json($users);
    }

    public function checkIfAdmin()
    {
        $user = Auth::user();

        return response()->json(['is_admin' => $user->id === 1]);
    }

    public function getSettings()
    {
        $user = Auth::user();

        $settings = $user->getSettings();

        return response()->json($settings);
    }

    public function getCurrencies()
    {
        return response()->json(UserCurrency::where('user_id', Auth::user()->id)->get());
    }

    public function getAllCurrencies()
    {
        return response()->json(Currency::all());
    }

    public function updateSettings(Request $request)
    {
        $user = Auth::user();

        $this->authorize('update', $user);

        $request->validate([
            'currency_id' => 'nullable|integer|exists:App\Models\Types\Currency,id'
        ]);

        $data = $request->only('currency_id');

        $user->update($data);

        return response()->json();
    }

    public function createCurrency(Request $request)
    {
        $request->validate([
            'currency_id' => 'required|integer|exists:App\Models\Types\Currency,id',
            'exchange_rate_to_default_currency' => 'required|numeric'
        ]);

        $data = $request->only('currency_id', 'exchange_rate_to_default_currency');

        (new UserCurrency($data))->save();

        return response()->json();
    }

    public function updateCurrency(Request $request, $id)
    {
        $request->validate([
            'exchange_rate_to_default_currency' => 'required|numeric'
        ]);

        $userCurrency = UserCurrency::where('user_id', Auth::user()->id)->where('id', $id)->first();

        if ($userCurrency) {
            $data = $request->only('exchange_rate_to_default_currency');
            $userCurrency->update($data);
        }

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
            'currency_id' => 'nullable|integer|exists:App\Models\UserCurrency,id'
        ]);


        $data = $request->only('name', 'email', 'password', 'currency_id');

        if (empty($data['password'])) {
            unset($data['password']);
        } else {
            $data['password'] = Hash::make($data['password']);
        }

        $user->update($data);

        return response()->json();
    }
}
