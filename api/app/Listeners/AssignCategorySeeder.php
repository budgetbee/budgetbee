<?php

namespace App\Listeners;

use App\Events\UserCreated;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Artisan;
use App\Models\ParentCategory;
use App\Models\Category;

class AssignCategorySeeder
{
    use InteractsWithQueue;

    /**
     * Handle the event.
     *
     * @param  UserCreated  $event
     * @return void
     */
    public function handle(UserCreated $event)
    {

        $json = file_get_contents(database_path('seeders/data/categories.json'));

        $data = json_decode($json, true);

        foreach ($data as $parentCategory) {
            $newParentCategory = new ParentCategory();
            $newParentCategory->fill([
                'user_id' => $event->user->id,
                'name' => $parentCategory['name'],
                'color' => $parentCategory['color'],
                'icon' => $parentCategory['icon']
            ]);
            $newParentCategory->save();

            foreach ($parentCategory['categories'] as $category) {
                $newCategory = new Category();
                $newCategory->fill([
                    'user_id' => $event->user->id,
                    'parent_category_id' => $newParentCategory->id,
                    'name' => $category['name'],
                    'icon' => $category['icon']
                ]);
                $newCategory->save();
            }
        }
    }
}
