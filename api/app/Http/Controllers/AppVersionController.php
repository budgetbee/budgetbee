<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AppVersionController extends Controller
{
    private function normalizeVersion(string $value): string
    {
        $normalized = trim($value);
        $normalized = ltrim($normalized, 'vV');

        return $normalized;
    }

    public function get()
    {
        $version = config('app.version');
        if ($version === 'I dont Know' || empty($version)) {
            $version = env('APP_VERSION', '0.9.1');
        }

        $repoOwner = 'budgetbee';
        $repoName = 'budgetbee';
        $cacheKey = 'latest_version';

        // Check if the latest version is already cached
        if (Cache::has($cacheKey)) {
            $latestVersion = Cache::get($cacheKey);
        } else {
            // Make a request to the GitHub API to get the latest release
            $apiUrl = "https://api.github.com/repos/{$repoOwner}/{$repoName}/releases/latest";
            $response = Http::get($apiUrl);

            if ($response->ok()) {
                $latestVersion = $response->json()['tag_name'];

                // Cache the latest version for future use
                Cache::put($cacheKey, $latestVersion, now()->addHours(4));
            } else {
                // Handle error response from the GitHub API
                return response()->json([
                    'version' => $version,
                    'new_version' => false,
                    'latest_version' => $version
                ]);
            }
        }

        $normalizedCurrentVersion = $this->normalizeVersion((string) $version);
        $normalizedLatestVersion = $this->normalizeVersion((string) $latestVersion);
        $hasNewVersion = version_compare($normalizedCurrentVersion, $normalizedLatestVersion, '<');

        return response()->json([
            'version' => $version,
            'new_version' => $hasNewVersion,
            'latest_version' => $latestVersion
        ]);
    }
}
