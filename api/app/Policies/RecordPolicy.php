<?php

namespace App\Policies;

use App\Models\Record;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class RecordPolicy
{

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Record $record): bool
    {
        return $user->id === $record->user_id;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Record $record): bool
    {
        return $user->id === $record->user_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Record $record): bool
    {
        return $user->id === $record->user_id;
    }
}
