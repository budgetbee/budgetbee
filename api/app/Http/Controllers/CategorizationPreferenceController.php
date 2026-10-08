<?php

namespace App\Http\Controllers;

use App\Models\CategoryCandidate;
use App\Models\CategoryRule;
use App\Models\Record;
use App\Models\User;
use App\Services\Categorization\CategoryLearner;
use App\Services\Categorization\MerchantKeyRebuilder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * The user's autocategoriser switch, and the onboarding that explains it.
 *
 * The switch is per user and arrives OFF: while it is off, importing a file does
 * not apply the rules learned from the user's own movements (the movement keeps
 * the fallback category and the user decides). The onboarding is shown once: a
 * modal when the app opens and a card in the settings screen, each of which
 * writes its own mark so it never comes back.
 *
 * The backfill is the same pair of jobs the console commands run, for one user
 * and on demand: rebuild the merchant key of the stored movements, then write
 * the evidence those movements already carry. It exists because the learner only
 * counts what passes through the import from now on, so a database with history
 * discusses nothing until it is read once.
 */
class CategorizationPreferenceController extends Controller
{
    /**
     * What the user can see about his own categoriser: the switch, whether the
     * onboarding is still pending, and the numbers the backfill moves.
     *
     * @return array<string,mixed>
     */
    private function payload(User $user): array
    {
        $userId = (int) $user->id;

        return [
            'enabled' => (bool) $user->auto_categorize_enabled,
            'intro_seen' => $user->categorization_intro_seen_at !== null,
            'card_seen' => $user->categorization_card_seen_at !== null,
            'stats' => $this->stats($userId),
        ];
    }

    /**
     * @return array{with_key:int,without_key:int,suggestions:int,rules:int}
     */
    private function stats(int $userId): array
    {
        return [
            'with_key' => Record::query()
                ->where('user_id', $userId)
                ->whereNotNull('merchant_key')
                ->where('merchant_key', '<>', '')
                ->count(),
            'without_key' => Record::query()
                ->where('user_id', $userId)
                ->where(function ($query) {
                    $query->whereNull('merchant_key')->orWhere('merchant_key', '');
                })
                ->count(),
            'suggestions' => CategoryCandidate::query()
                ->where('user_id', $userId)
                ->whereNull('ignored_at')
                ->count(),
            'rules' => CategoryRule::forUser($userId)->count(),
        ];
    }

    public function show(Request $request): JsonResponse
    {
        return response()->json($this->payload($request->user()));
    }

    /**
     * Turn the autocategoriser on or off. The server answers with the state it
     * stored, so the screen never shows a switch that lies.
     */
    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'enabled' => 'required|boolean',
        ]);

        $user = $request->user();
        $user->auto_categorize_enabled = (bool) $data['enabled'];
        $user->save();

        return response()->json($this->payload($user));
    }

    public function markIntroSeen(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->categorization_intro_seen_at === null) {
            $user->categorization_intro_seen_at = now();
            $user->save();
        }

        return response()->json(['ok' => true, 'intro_seen' => true]);
    }

    public function markCardSeen(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->categorization_card_seen_at === null) {
            $user->categorization_card_seen_at = now();
            $user->save();
        }

        return response()->json(['ok' => true, 'card_seen' => true]);
    }

    /**
     * Read the movements the user already has: rebuild their merchant key and
     * write the evidence they carry. Nothing is categorised here and no rule is
     * applied to anything: this only prepares what the categoriser suggests.
     */
    public function backfill(
        Request $request,
        MerchantKeyRebuilder $rebuilder,
        CategoryLearner $learner
    ): JsonResponse {
        $userId = (int) $request->user()->id;

        $before = $this->stats($userId);

        $rebuilt = $rebuilder->rebuild($userId);
        $learned = $learner->learnFromHistory($userId);

        return response()->json([
            'ok' => true,
            'before' => $before,
            'after' => $this->stats($userId),
            'scanned' => (int) ($rebuilt['scanned'] ?? 0),
            'keys_rewritten' => (int) ($rebuilt['changed'] ?? 0),
            'evidence_pairs' => (int) ($learned['pairs'] ?? 0),
            'rules_created' => (int) ($learned['rules'] ?? 0),
        ]);
    }
}
