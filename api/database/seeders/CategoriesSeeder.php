<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\ParentCategory;
use App\Models\Category;

class CategoriesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $json = file_get_contents(__DIR__ . '/data/categories.json');
        $data = json_decode($json, true);


        foreach ($data as $parentCategory) {
            $newParentCategory = new ParentCategory();
            $newParentCategory->fill([
                'name' => $parentCategory['name'],
                'color' => $parentCategory['color'],
                'icon' => $parentCategory['icon']
            ]);
            $newParentCategory->save();

            foreach ($parentCategory['categories'] as $category) {
                $newCategory = new Category();
                $newCategory->fill([
                    'parent_category_id' => $newParentCategory->id,
                    'name' => $category['name'],
                    'icon' => $category['icon']
                ]);
                $newCategory->save();
            }
        }
    }
}
