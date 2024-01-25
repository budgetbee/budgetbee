<?php

namespace App\Providers;

// use Illuminate\Support\Facades\Gate;
use App\Models\User;
use App\Models\Budget;
use App\Models\Record;
use App\Models\Account;
use App\Policies\UserPolicy;
use App\Policies\BudgetPolicy;
use App\Policies\RecordPolicy;
use App\Policies\AccountPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The model to policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        Record::class => RecordPolicy::class,
        Account::class => AccountPolicy::class,
        User::class => UserPolicy::class,
        Budget::class => BudgetPolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
