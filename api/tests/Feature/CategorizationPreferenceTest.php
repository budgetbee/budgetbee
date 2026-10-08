<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\Account;
use App\Models\Category;
use App\Models\ParentCategory;
use App\Models\Record;
use App\Models\CategoryRule;
use App\Models\CategoryCandidate;
use App\Models\UserCurrency;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * The autocategoriser has a switch, and it arrives off.
 *
 * Filing movements on its own is something the user asks for, not something that
 * happens to him on an update: while the switch is off, importing a file does not
 * apply the learned rules. The onboarding that explains the switch (a modal and a
 * card, each shown once per user) writes its own mark, and those marks are never
 * reset.
 *
 * The wordings here are invented: no real merchant belongs in a test file.
 */
class CategorizationPreferenceTest extends TestCase
{
    private $user;
    private $account;
    private $userCurrency;
    private $category;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);
        $this->actingAs($this->user);

        $this->userCurrency = UserCurrency::factory()->create(['user_id' => $this->user->id]);
        $this->account = Account::factory()->create([
            'user_id' => $this->user->id,
            'currency_id' => $this->userCurrency->id,
        ]);

        $this->category = Category::create([
            'user_id' => $this->user->id,
            'name' => 'Hardware',
            'parent_category_id' => ParentCategory::first()->id,
            'icon' => 'fa-solid fa-tag',
            'enabled' => true,
        ]);
    }

    public function tearDown(): void
    {
        Record::where('user_id', $this->user->id)->delete();
        CategoryCandidate::where('user_id', $this->user->id)->delete();
        CategoryRule::where('user_id', $this->user->id)->delete();
        $this->account->delete();
        $this->userCurrency->delete();
        $this->user->delete();

        parent::tearDown();
    }

    /**
     * A file without any category of its own, imported with the screen's own
     * "auto categorise" box ticked — which is exactly the case where the learned
     * rules would decide for the user.
     */
    private function import(string $name, int $rows = 4): void
    {
        $csv = "date,from_account_id,to_account_id,type,category_id,name,amount,rate\n";

        for ($i = 0; $i < $rows; $i++) {
            $csv .= sprintf(
                "2026-09-%02d,%d,,expense,,%s,%d.00,1\n",
                $i + 1,
                $this->account->id,
                $name,
                10 + $i
            );
        }

        Storage::fake('uploads');

        $this->post('/api/import', [
            'file' => UploadedFile::fake()->createWithContent('a.csv', $csv),
            'auto_categorise' => '1',
        ])->assertStatus(200);
    }

    private function learnRuleFor(string $merchantKey): void
    {
        CategoryRule::create([
            'user_id' => $this->user->id,
            'match_field' => 'merchant_key',
            'operator' => 'contains',
            'value' => $merchantKey,
            'category_id' => $this->category->id,
            'priority' => 0,
            'source' => CategoryRule::SOURCE_LEARNED,
            'enabled' => true,
        ]);
    }

    public function test_the_autocategoriser_is_off_until_the_user_turns_it_on(): void
    {
        $this->assertFalse((bool) $this->user->fresh()->auto_categorize_enabled);

        $this->getJson('/api/categorization/preferences')
            ->assertStatus(200)
            ->assertJsonPath('enabled', false)
            ->assertJsonPath('intro_seen', false)
            ->assertJsonPath('card_seen', false);
    }

    public function test_the_user_can_turn_it_on_and_off_again(): void
    {
        $this->postJson('/api/categorization/preferences', ['enabled' => true])
            ->assertStatus(200)
            ->assertJsonPath('enabled', true);

        $this->assertTrue((bool) $this->user->fresh()->auto_categorize_enabled);

        $this->postJson('/api/categorization/preferences', ['enabled' => false])
            ->assertStatus(200)
            ->assertJsonPath('enabled', false);

        $this->assertFalse((bool) $this->user->fresh()->auto_categorize_enabled);
    }

    public function test_the_onboarding_marks_are_written_once_and_stay_written(): void
    {
        $this->postJson('/api/categorization/preferences/intro-seen')->assertStatus(200);
        $this->postJson('/api/categorization/preferences/card-seen')->assertStatus(200);

        $user = $this->user->fresh();
        $this->assertNotNull($user->categorization_intro_seen_at);
        $this->assertNotNull($user->categorization_card_seen_at);

        $firstIntro = $user->categorization_intro_seen_at;

        // Seeing it again does not move the mark: it was seen once, and that is
        // what keeps it from coming back.
        $this->postJson('/api/categorization/preferences/intro-seen')->assertStatus(200);
        $this->assertEquals($firstIntro, $this->user->fresh()->categorization_intro_seen_at);

        $this->getJson('/api/categorization/preferences')
            ->assertStatus(200)
            ->assertJsonPath('intro_seen', true)
            ->assertJsonPath('card_seen', true);
    }

    public function test_learned_rules_are_not_applied_while_the_switch_is_off(): void
    {
        $this->learnRuleFor('ACME STORE');

        $this->import('ACME STORE');

        $categorised = Record::where('user_id', $this->user->id)
            ->where('category_id', $this->category->id)
            ->count();

        $this->assertSame(0, $categorised, 'Con el interruptor apagado no decide la app');
    }

    public function test_learned_rules_are_applied_once_the_switch_is_on(): void
    {
        $this->learnRuleFor('ACME STORE');

        $this->postJson('/api/categorization/preferences', ['enabled' => true])->assertStatus(200);

        $this->import('ACME STORE');

        $categorised = Record::where('user_id', $this->user->id)
            ->where('category_id', $this->category->id)
            ->count();

        $this->assertSame(4, $categorised, 'Con el interruptor encendido si categoriza solo');
    }

    public function test_the_backfill_reads_the_stored_movements_and_reports_what_it_did(): void
    {
        // History as it is before the backfill: movements with a name and a
        // category, but with no merchant key yet.
        foreach (['ACME STORE', 'ACME STORE', 'ACME STORE', 'OTHER SHOP'] as $i => $name) {
            Record::create([
                'user_id' => $this->user->id,
                'date' => '2026-09-0' . ($i + 1),
                'from_account_id' => $this->account->id,
                'type' => 'expense',
                'name' => $name,
                'amount' => 10 + $i,
                'category_id' => $this->category->id,
                // The code is unique across the whole table, and the test
                // database is not wiped between runs: it has to be invented here.
                'code' => 'backfill-' . $i . '-' . bin2hex(random_bytes(8)),
            ]);
        }

        $this->assertSame(0, Record::where('user_id', $this->user->id)->whereNotNull('merchant_key')->count());

        $response = $this->postJson('/api/categorization/preferences/backfill')->assertStatus(200);

        $response->assertJsonPath('ok', true);
        $this->assertSame(4, (int) $response->json('scanned'));
        $this->assertSame(4, (int) $response->json('keys_rewritten'));
        $this->assertGreaterThan(0, (int) $response->json('evidence_pairs'));

        $this->assertSame(
            4,
            Record::where('user_id', $this->user->id)->whereNotNull('merchant_key')->count(),
            'La pasada deja la clave escrita en los movimientos que ya estaban'
        );

        // The evidence is there and the rule was born from it, as the command does.
        $this->assertGreaterThan(0, CategoryCandidate::where('user_id', $this->user->id)->count());
        $this->assertSame(1, (int) $response->json('rules_created'));

        // Nothing was categorised by the backfill: the movements keep what they had.
        $this->assertSame(
            4,
            Record::where('user_id', $this->user->id)->where('category_id', $this->category->id)->count()
        );
    }
}
