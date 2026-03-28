<?php

namespace App\Policies;

use App\Models\User;
use App\Models\UpcomingExpense;

class UpcomingExpensePolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return $user->id === $upcomingExpense->user_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return $user->id === $upcomingExpense->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, UpcomingExpense $upcomingExpense): bool
    {
        return $user->id === $upcomingExpense->user_id;
    }
}
