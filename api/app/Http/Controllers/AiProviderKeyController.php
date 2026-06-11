<?php

namespace App\Http\Controllers;

use App\Models\AiProviderKey;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AiProviderKeyController extends Controller
{
    /**
     * Get all AI provider keys for the authenticated user.
     * Returns masked keys so the full key is never exposed in responses.
     */
    public function index(Request $request)
    {
        $user = Auth::user();

        $keys = AiProviderKey::where('user_id', $user->id)->get()->map(function ($key) {
            return [
                'id' => $key->id,
                'provider' => $key->provider,
                'masked_key' => $key->getMaskedKeyAttribute(),
                'updated_at' => $key->updated_at,
            ];
        });

        return response()->json($keys);
    }

    /**
     * Store or update an AI provider key for the authenticated user.
     * Uses upsert pattern: one key per provider per user.
     */
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'provider' => 'required|string|in:' . implode(',', AiProviderKey::PROVIDERS),
            'api_key' => 'required|string|min:1|max:500',
        ]);

        $provider = $request->input('provider');
        $apiKey = $request->input('api_key');

        // Upsert: update if exists, otherwise create
        AiProviderKey::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => $provider,
            ],
            [
                'api_key' => $apiKey,
            ]
        );

        return response()->json(['message' => 'API key saved successfully.']);
    }

    /**
     * Delete an AI provider key.
     */
    public function destroy($id)
    {
        $user = Auth::user();

        $key = AiProviderKey::where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        $key->delete();

        return response()->json(['message' => 'API key deleted successfully.']);
    }
}
