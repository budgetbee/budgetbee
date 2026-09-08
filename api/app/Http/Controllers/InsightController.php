<?php

namespace App\Http\Controllers;

use App\Models\Insight;
use App\Services\InsightGenerator;
use Illuminate\Http\Request;

class InsightController extends Controller
{
    /**
     * Active insights for the current user. Generation is lazy: the first
     * request of a period creates them, later requests only refresh the
     * month-level ones at most once a day.
     */
    public function index(Request $request)
    {
        $user = $request->user();

        try {
            (new InsightGenerator())->generateFor($user);
        } catch (\Throwable $e) {
            // Never break the dashboard because of an insight failure.
            report($e);
        }

        $insights = Insight::where('user_id', $user->id)
            ->whereNull('dismissed_at')
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get(['id', 'type', 'title', 'body', 'data', 'read_at', 'created_at', 'updated_at']);

        return response()->json($insights);
    }

    public function read(Request $request, $id)
    {
        $insight = Insight::where('user_id', $request->user()->id)->findOrFail($id);
        $insight->update(['read_at' => now()]);

        return response()->json(['success' => true]);
    }

    public function dismiss(Request $request, $id)
    {
        $insight = Insight::where('user_id', $request->user()->id)->findOrFail($id);
        $insight->update(['dismissed_at' => now()]);

        return response()->json(['success' => true]);
    }
}
