<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class AppVersionController extends Controller
{
    public function get()
    {
        $version = config('app.version');
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
                Cache::put($cacheKey, $latestVersion, 60);
            } else {
                // Handle error response from the GitHub API
                return response()->json([
                    'version' => $version,
                    'new_version' => 'false',
                    'latest_version' => $version
                ]);
            }
        }

        return response()->json([
            'version' => $version,
            'new_version' => $version != $latestVersion,
            'latest_version' => $latestVersion
        ]);
    }
}
