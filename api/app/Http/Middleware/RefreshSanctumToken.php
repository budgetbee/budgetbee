<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Laravel\Sanctum\PersonalAccessToken;

class RefreshSanctumToken
{
    /**
     * Time in minutes before token expiry to trigger a refresh.
     */
    protected int $refreshThreshold = 10;

    /**
     * Handle an incoming request.
     *
     * This middleware MUST run AFTER 'auth:sanctum' so that $request->user()
     * and currentAccessToken() are populated.
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $user = $request->user();

        if (!$user) {
            return $response;
        }

        $token = $request->user()->currentAccessToken();

        if (!$token || !($token instanceof PersonalAccessToken)) {
            return $response;
        }

        // Check if the token is close to expiring
        $expiration = config('sanctum.expiration');

        if ($expiration === null) {
            return $response; // Tokens don't expire
        }

        $createdAt = $token->created_at;
        $refreshAt = $createdAt->copy()->addMinutes($expiration - $this->refreshThreshold);

        if (now()->greaterThanOrEqualTo($refreshAt)) {
            // Token is close to expiring → issue a new one
            // We do NOT delete the old token to avoid race conditions
            // and orphaned sessions on network errors. The old token
            // will expire naturally within the threshold window.
            $newToken = $user->createToken('auth_token')->plainTextToken;

            // Attach the new token to the response
            $response->headers->set('X-New-Token', $newToken);
        }

        return $response;
    }
}
