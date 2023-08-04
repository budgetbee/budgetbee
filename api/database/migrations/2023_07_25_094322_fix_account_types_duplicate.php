<?php

use App\Models\Record;
use App\Models\AccountTypes;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use App\Models\Account;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {

        $accounts = Account::where('type_id', '>', 8)->get();

        foreach ($accounts as $account) {
            $typeName = $account->type_name;
            $realAccount = AccountTypes::where('id', '<=', 8)->where('name', $typeName)->first();

            if ($realAccount) {
                $account->fill(['type_id' => $realAccount->id]);
                $account->save();
            }
        }

        AccountTypes::where('id', '>', 8)->delete();

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
