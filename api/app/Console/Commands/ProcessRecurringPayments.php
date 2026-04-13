<?php

namespace App\Console\Commands;

use App\Models\Record;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessRecurringPayments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'records:process-recurring';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Create records for all recurring payments due today';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $today = Carbon::today();
        $dayOfMonth = (int) $today->format('j');
        $lastDayOfMonth = (int) $today->copy()->endOfMonth()->format('j');
        $isLastDayOfMonth = ($dayOfMonth === $lastDayOfMonth);
        $startOfMonth = $today->copy()->startOfMonth()->toDateString();

        // Match records whose recurring_day equals today's day-of-month, OR whose
        // recurring_day exceeds the total days in this month (e.g. day 31 in a
        // 30-day month) and today is the last day of the month.
        $recurringRecords = Record::whereNotNull('recurring_day')
            ->where(function ($query) use ($dayOfMonth, $lastDayOfMonth, $isLastDayOfMonth) {
                $query->where('recurring_day', $dayOfMonth);
                if ($isLastDayOfMonth) {
                    $query->orWhere('recurring_day', '>', $lastDayOfMonth);
                }
            })
            ->where(function ($query) use ($startOfMonth) {
                $query->whereNull('last_recurring_date')
                    ->orWhere('last_recurring_date', '<', $startOfMonth);
            })
            ->get();

        $count = 0;

        foreach ($recurringRecords as $record) {
            Record::disableAiControllerProcessing();

            $newRecord = new Record();
            $newRecord->fill([
                'user_id'         => $record->user_id,
                'date'            => $today->toDateString(),
                'from_account_id' => $record->from_account_id,
                'to_account_id'   => $record->to_account_id,
                'type'            => $record->type,
                'category_id'     => $record->category_id,
                'name'            => $record->name,
                'description'     => $record->description,
                'amount'          => $record->amount,
                'rate'            => $record->rate,
            ]);
            $newRecord->save();

            Record::enableAiControllerProcessing();

            $record->last_recurring_date = $today->toDateString();
            $record->save();

            $count++;
        }

        $this->info("Processed {$count} recurring payment(s).");

        return Command::SUCCESS;
    }
}
