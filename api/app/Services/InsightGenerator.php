<?php

namespace App\Services;

use App\Models\Insight;
use App\Models\Record;
use App\Models\UpcomingExpense;
use App\Models\Category;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Generates proactive, human-written insights from the user's own data.
 *
 * Insights are deterministic (no external AI calls): every self-hosted user
 * gets them even without an API key. Text is built from real numbers and the
 * record's own category names so it always reads naturally.
 */
class InsightGenerator
{
    protected $user;
    protected $symbol;

    public function generateFor($user): array
    {
        $this->user = $user;
        $this->symbol = $user->currency_symbol ?: '€';

        if ($this->recordCount() < 5) {
            return []; // not enough data yet — do not bother new users
        }

        $created = [];
        $created = array_merge($created, $this->weeklySummary());
        $created = array_merge($created, $this->monthlyForecast());
        $created = array_merge($created, $this->subscriptions());
        $created = array_merge($created, $this->biggestRise());

        return $created;
    }

    /* ------------------------------------------------------------------
     | Helpers
     | ------------------------------------------------------------------ */

    protected function recordCount(): int
    {
        return Record::where('user_id', $this->user->id)->count();
    }

    protected function expenseCategoryIds(): array
    {
        return Category::idsByParentType($this->user->id, 'expense');
    }

    protected function incomeCategoryIds(): array
    {
        return Category::idsByParentType($this->user->id, 'income');
    }

    /**
     * Signed net total (expenses stored negative, refunds/incomes positive)
     * for records of the user inside a date range.
     */
    protected function netInRange(Carbon $from, Carbon $to, array $categoryIds): float
    {
        if (empty($categoryIds)) {
            return 0.0;
        }

        return (float) Record::where('user_id', $this->user->id)
            ->with(['category.parent'])
            ->whereBetween('date', [$from->toDateString(), $to->toDateString()])
            ->whereIn('category_id', $categoryIds)
            ->get()
            ->sum('amount_base_currency');
    }

    protected function fmt(float $value): string
    {
        return number_format(abs($value), 2, '.', ',') . ' ' . $this->symbol;
    }

    /**
     * Persist an insight, refreshing it at most once per day when the
     * underlying data changes (monthly items), and never resurrecting one
     * the user dismissed.
     */
    protected function persist(string $type, string $periodKey, string $title, string $body, array $data = []): ?Insight
    {
        $existing = Insight::where('user_id', $this->user->id)
            ->where('type', $type)
            ->where('period_key', $periodKey)
            ->first();

        if ($existing) {
            if ($existing->dismissed_at || $existing->updated_at->isToday()) {
                return null;
            }
            $existing->update([
                'title' => $title,
                'body' => $body,
                'data' => $data ?: null,
                'read_at' => null,
            ]);

            return $existing;
        }

        return Insight::create([
            'user_id' => $this->user->id,
            'type' => $type,
            'period_key' => $periodKey,
            'title' => $title,
            'body' => $body,
            'data' => $data ?: null,
        ]);
    }

    /* ------------------------------------------------------------------
     | Detectors
     | ------------------------------------------------------------------ */

    /**
     * Weekly check: how did last week compare with the previous 8 weeks?
     */
    protected function weeklySummary(): array
    {
        $today = Carbon::today();
        $lastMonday = $today->copy()->startOfWeek()->subWeek();     // Monday of last week
        $lastSunday = $lastMonday->copy()->addDays(6);              // Sunday of last week
        $startWindow = $lastMonday->copy()->subWeeks(8);            // 8 weeks before that

        $expenseIds = $this->expenseCategoryIds();
        if (empty($expenseIds)) {
            return [];
        }

        $records = Record::where('user_id', $this->user->id)
            ->with(['category.parent'])
            ->whereBetween('date', [$startWindow->toDateString(), $lastSunday->toDateString()])
            ->whereIn('category_id', $expenseIds)
            ->get();

        $weekTotals = [];
        $byName = [];
        foreach ($records as $record) {
            $date = Carbon::parse($record->date);
            if ($date >= $lastMonday) {
                $weekTotals[] = (float) $record->amount_base_currency;
                $byName[$record->parent_category_name] = ($byName[$record->parent_category_name] ?? 0) + (float) $record->amount_base_currency;
            }
        }

        if (count($weekTotals) === 0) {
            return [];
        }

        $lastWeek = -array_sum($weekTotals); // expenses stored negative → positive total

        $previousRecords = $records->filter(fn ($r) => Carbon::parse($r->date) < $lastMonday);
        $previous = -$previousRecords->sum('amount_base_currency');
        $weeklyAverage = $previous / 8;

        if ($weeklyAverage <= 0) {
            $changePct = null;
        } else {
            $changePct = ($lastWeek - $weeklyAverage) / $weeklyAverage * 100;
        }

        $topCategory = !empty($byName) ? array_keys($byName, max($byName))[0] : null;

        $period = 'w-' . $lastMonday->toDateString();

        if ($changePct === null || abs($changePct) < 10) {
            return $this->persist(
                'summary',
                $period,
                'Your week at a glance',
                'Last week you spent ' . $this->fmt($lastWeek) . ', in line with your weekly average of ' . $this->fmt($weeklyAverage) . '.'
            ) ? [$period] : [];
        }

        if ($changePct > 0) {
            $title = 'Spending spike last week';
            $body = 'Last week you spent ' . $this->fmt($lastWeek) . ', ' . number_format($changePct, 0) . '% more than your usual '
                . $this->fmt($weeklyAverage) . ' per week.';
            if ($topCategory) {
                $body .= ' The biggest driver was "' . $topCategory . '".';
            }
        } else {
            $title = 'Nice — spending went down';
            $body = 'Last week you spent ' . $this->fmt($lastWeek) . ', ' . number_format(abs($changePct), 0) . '% less than your usual '
                . $this->fmt($weeklyAverage) . ' per week. Keep it up!';
        }

        return $this->persist('summary', $period, $title, $body, [
            'last_week' => round($lastWeek, 2),
            'average' => round($weeklyAverage, 2),
            'change_pct' => round($changePct, 1),
        ]) ? [$period] : [];
    }

    /**
     * Month-end projection based on current pace + known upcoming expenses.
     */
    protected function monthlyForecast(): array
    {
        $today = Carbon::today();
        $monthKey = $today->format('Y-m');
        $startMonth = $today->copy()->startOfMonth();

        $expenseIds = $this->expenseCategoryIds();
        $incomeIds = $this->incomeCategoryIds();

        // Current month so far
        $spentThisMonth = -$this->netInRange($startMonth, $today, $expenseIds);
        $daysIntoMonth = (int) $today->format('j');
        $daysInMonth = $today->daysInMonth;

        if ($spentThisMonth <= 0) {
            return [];
        }

        $dailyPace = $spentThisMonth / max($daysIntoMonth - 1, 1);
        $projectedSpend = $dailyPace * $daysInMonth;

        // Add future planned expenses this month (upcoming expenses)
        $upcomingTotal = (float) UpcomingExpense::where('user_id', $this->user->id)
            ->where('due_date', '>', $today->toDateString())
            ->where('due_date', '<=', $startMonth->copy()->addMonth()->subDay()->toDateString())
            ->sum('amount');
        $projectedSpend += $upcomingTotal;

        // Average monthly income over the last 3 full months (or current if new)
        $incomeStart = $startMonth->copy()->subMonths(3);
        $incomeTotal = $this->netInRange($incomeStart, $today, $incomeIds);
        $incomeMonths = 3;
        $avgIncome = $incomeTotal / $incomeMonths;

        $result = $avgIncome - $projectedSpend;
        $period = 'm-' . $monthKey;

        $body = 'At your current pace you will spend about ' . $this->fmt($projectedSpend)
            . ' this month (including ' . $this->fmt($upcomingTotal) . ' of planned expenses).';
        $data = [
            'projected_spend' => round($projectedSpend, 2),
            'spent_so_far' => round($spentThisMonth, 2),
            'upcoming' => round($upcomingTotal, 2),
            'avg_income' => round($avgIncome, 2),
            'result' => round($result, 2),
        ];

        if ($avgIncome <= 0) {
            return $this->persist(
                'forecast',
                $period,
                'Where your month is heading',
                $body . ' You have not logged income yet, so this only covers spending.'
            ) ? [$period] : [];
        }

        if ($result >= 0) {
            $title = 'Looking good for the month';
            $body .= ' With about ' . $this->fmt($avgIncome) . ' of income expected, you could end the month with '
                . $this->fmt($result) . ' to spare.';
        } else {
            $title = 'Heads up: month may end negative';
            $body .= ' With about ' . $this->fmt($avgIncome) . ' of income expected, the month could end '
                . $this->fmt($result) . ' in the red.';
        }

        return $this->persist('forecast', $period, $title, $body, $data) ? [$period] : [];
    }

    /**
     * Detect likely monthly subscriptions: same category + same amount,
     * at least 3 occurrences spread over ~45+ days.
     */
    protected function subscriptions(): array
    {
        $today = Carbon::today();
        $windowStart = $today->copy()->subDays(150);
        $period = 'm-' . $today->format('Y-m');

        $expenseIds = $this->expenseCategoryIds();
        if (empty($expenseIds)) {
            return [];
        }

        $records = Record::where('user_id', $this->user->id)
            ->with(['category.parent'])
            ->where('date', '>=', $windowStart->toDateString())
            ->whereIn('category_id', $expenseIds)
            ->where('amount', '<', 0)
            ->get(['id', 'date', 'category_id', 'amount', 'name']);

        $groups = [];
        foreach ($records as $record) {
            $key = $record->category_id . '|' . round(abs($record->amount), 2);
            $groups[$key][] = Carbon::parse($record->date);
        }

        $found = [];
        foreach ($groups as $key => $dates) {
            if (count($dates) < 3) {
                continue;
            }
            sort($dates);
            $spanDays = $dates[0]->diffInDays($dates[count($dates) - 1]);
            if ($spanDays < 45) {
                continue;
            }
            // median gap between consecutive occurrences should be roughly monthly
            $gaps = [];
            for ($i = 1; $i < count($dates); $i++) {
                $gaps[] = $dates[$i - 1]->diffInDays($dates[$i]);
            }
            sort($gaps);
            $medianGap = $gaps[intdiv(count($gaps), 2)];
            if ($medianGap < 20 || $medianGap > 45) {
                continue;
            }

            [$categoryId, $amount] = explode('|', $key);
            $sample = $records->firstWhere('category_id', (int) $categoryId);
            $name = $sample?->category_name ?: 'Unknown';

            $found[] = [
                'name' => $name,
                'amount' => round((float) $amount, 2),
                'occurrences' => count($dates),
                'last_date' => $dates[count($dates) - 1]->toDateString(),
            ];
        }

        if (empty($found)) {
            return [];
        }

        usort($found, fn ($a, $b) => $b['amount'] - $a['amount']);
        $total = array_sum(array_column($found, 'amount'));

        $listing = '';
        $shown = array_slice($found, 0, 4);
        foreach ($shown as $sub) {
            $listing .= '• ' . $sub['name'] . ' — ' . $this->fmt($sub['amount']) . "/month\n";
        }
        if (count($found) > 4) {
            $listing .= '• and ' . (count($found) - 4) . ' more';
        }

        $title = count($found) . ' recurring payment' . (count($found) > 1 ? 's' : '') . ' detected';
        $body = "I found " . count($found) . " likely monthly subscription" . (count($found) > 1 ? 's' : '') . ' adding up to '
            . $this->fmt($total) . " per month:\n" . trim($listing)
            . "\n\nReview them — cancelling unused ones is the fastest way to save.";

        return $this->persist('subscriptions', $period, $title, $body, [
            'total_monthly' => round($total, 2),
            'items' => $found,
        ]) ? [$period] : [];
    }

    /**
     * Biggest category rise: this month vs last month (net expenses).
     */
    protected function biggestRise(): array
    {
        $today = Carbon::today();
        $startMonth = $today->copy()->startOfMonth();
        $lastMonthStart = $startMonth->copy()->subMonth();
        $lastMonthEnd = $startMonth->copy()->subDay();
        $period = 'm-' . $today->format('Y-m');

        $expenseIds = $this->expenseCategoryIds();
        if (empty($expenseIds)) {
            return [];
        }

        $records = Record::where('user_id', $this->user->id)
            ->with(['category.parent'])
            ->whereBetween('date', [$lastMonthStart->toDateString(), $today->toDateString()])
            ->whereIn('category_id', $expenseIds)
            ->get();

        $byParent = [];
        foreach ($records as $record) {
            $date = Carbon::parse($record->date);
            $parent = $record->parent_category_name ?: 'Other';
            if ($date < $startMonth) {
                $byParent[$parent]['prev'] = ($byParent[$parent]['prev'] ?? 0) + (float) $record->amount_base_currency;
            } else {
                $byParent[$parent]['curr'] = ($byParent[$parent]['curr'] ?? 0) + (float) $record->amount_base_currency;
            }
        }

        $best = null;
        foreach ($byParent as $name => $totals) {
            $prev = -($totals['prev'] ?? 0);
            $curr = -($totals['curr'] ?? 0);
            if ($prev < 5 || $curr <= $prev * 1.3 || ($curr - $prev) < 10) {
                continue;
            }
            $pct = ($curr - $prev) / $prev * 100;
            if ($best === null || ($curr - $prev) > $best['diff']) {
                $best = ['name' => $name, 'prev' => $prev, 'curr' => $curr, 'pct' => $pct, 'diff' => $curr - $prev];
            }
        }

        if ($best === null) {
            return [];
        }

        $title = 'Rise in "' . $best['name'] . '"';
        $body = 'You have spent ' . $this->fmt($best['curr']) . ' on "' . $best['name'] . '" so far this month vs '
            . $this->fmt($best['prev']) . ' in the whole of last month (+' . number_format($best['pct'], 0) . '%).';

        return $this->persist('increase', $period, $title, $body, $best) ? [$period] : [];
    }
}
