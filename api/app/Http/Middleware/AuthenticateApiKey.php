<?php

namespace App\Http\Middleware;

use App\Models\ApiKey;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiKey
{
    public function handle(Request $request, Closure $next): Response
    {
        $apiKeyValue = $request->header('X-API-Key');

        if (!$apiKeyValue) {
            return response()->json(['message' => 'API key is required'], 401);
        }

        $hashedKey = hash('sha256', $apiKeyValue);

        $apiKey = ApiKey::where('key', $hashedKey)->first();

        if (!$apiKey) {
            return response()->json(['message' => 'Invalid API key'], 401);
        }

        if ($apiKey->isExpired()) {
            return response()->json(['message' => 'API key has expired'], 401);
        }

        $apiKey->update(['last_used_at' => now()]);

        Auth::loginUsingId($apiKey->user_id);

        return $next($request);
    }
}
