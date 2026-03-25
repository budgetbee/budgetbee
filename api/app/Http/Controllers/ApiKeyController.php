<?php

namespace App\Http\Controllers;

use App\Models\ApiKey;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ApiKeyController extends Controller
{
    public function index(Request $request)
    {
        $apiKeys = ApiKey::where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json($apiKeys);
    }

    public function store(Request $request)
    {
        $this->validate($request, [
            'name' => 'required|string|max:255',
        ]);

        $plainTextKey = Str::random(48);
        $hashedKey = hash('sha256', $plainTextKey);

        $apiKey = ApiKey::create([
            'user_id' => $request->user()->id,
            'name' => $request->input('name'),
            'key' => $hashedKey,
        ]);

        return response()->json([
            'id' => $apiKey->id,
            'name' => $apiKey->name,
            'key' => $plainTextKey,
            'created_at' => $apiKey->created_at,
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $apiKey = ApiKey::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$apiKey) {
            return response()->json(['message' => 'API key not found'], 404);
        }

        $apiKey->delete();

        return response()->json(['message' => 'API key deleted']);
    }
}
