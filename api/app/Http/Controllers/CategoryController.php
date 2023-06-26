<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ParentCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{

    public function get()
    {
        $categories = Category::all();

        return response()->json($categories);
    }

    public function getByParentId($id)
    {
        $categories = Category::where('parent_category_id', $id)->get();

        return response()->json($categories);
    }

    public function getById($id)
    {
        $categories = Category::find($id);

        return response()->json($categories);
    }

    public function getParent()
    {
        $categories = ParentCategory::all();

        return response()->json($categories);
    }

    public function getParentById($id)
    {
        $categories = ParentCategory::find($id);

        return response()->json($categories);
    }

    public function create(Request $request)
    {

        $this->validate($request, [
            'parent_category_id' => 'required',
            'name' => 'required',
        ]);

        $data = $request->only('color', 'icon', 'name', 'parent_category_id');

        $category = new Category();
        $category->fill($data);
        $category->save();

        return response()->json(['id' => $category->id]);
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'parent_category_id' => 'required',
            'name' => 'required',
        ]);

        $data = $request->only('color', 'icon', 'name', 'parent_category_id');

        $category = Category::find($id);
        $category->fill($data);
        $category->save();

        return response()->json($category);
    }

}
