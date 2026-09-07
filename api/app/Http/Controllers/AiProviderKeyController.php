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
                'provider_name' => $key->getProviderDisplayName(),
                'masked_key' => $key->getMaskedKeyAttribute(),
                'base_url' => $key->base_url,
                'model' => $key->model,
                'supports_vision' => (bool) $key->supports_vision,
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
            // Custom OpenAI-compatible providers need at least a base URL.
            'base_url' => [
                'nullable',
                'string',
                'max:500',
                'required_if:provider,custom',
                function ($attribute, $value, $fail) {
                    if ($value !== null && $value !== '') {
                        $value = rtrim($value, '/');
                        if (!preg_match('#^https?://#i', $value)) {
                            $fail('The base URL must start with http:// or https://');
                        }
                    }
                },
            ],
            'model' => [
                'nullable',
                'string',
                'max:200',
                'required_if:provider,custom',
            ],
            'supports_vision' => 'nullable|boolean',
        ]);

        $provider = $request->input('provider');
        $apiKey = $request->input('api_key');
        $baseUrl = $request->filled('base_url') ? rtrim($request->input('base_url'), '/') : null;
        $model = $request->input('model');
        $supportsVision = $request->boolean('supports_vision');

        // Upsert: update if exists, otherwise create
        AiProviderKey::updateOrCreate(
            [
                'user_id' => $user->id,
                'provider' => $provider,
            ],
            [
                'api_key' => $apiKey,
                'base_url' => $baseUrl,
                'model' => $model,
                'supports_vision' => $supportsVision,
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
