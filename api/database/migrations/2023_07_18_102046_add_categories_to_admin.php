<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\ParentCategory;
use App\Models\Category;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        ParentCategory::whereNull('user_id')->update(['user_id' => 1]);
        Category::whereNull('user_id')->update(['user_id' => 1]);
    }

};
