<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ParentCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{

    public function get(Request $request)
    {
        $categories = Category::where('user_id', $request->user()->id)->get();

        return response()->json($categories);
    }

    public function getByParentId(Request $request, $id)
    {
        $categories = Category::where('parent_category_id', $id)->where('user_id', $request->user()->id)->get();

        return response()->json($categories);
    }

    public function getById($id)
    {
        $category = Category::find($id);

        $this->authorize('view', $category);

        return response()->json($category);
    }

    public function getParent(Request $request)
    {
        $categories = ParentCategory::where('user_id', $request->user()->id)->get();

        return response()->json($categories);
    }

    public function getParentById(Request $request, $id)
    {
        $parentCategory = ParentCategory::where('user_id', $request->user()->id)->find($id);

        return response()->json($parentCategory);
    }

    public function create(Request $request)
    {

        $this->validate($request, [
            'parent_category_id' => 'required|integer|exists:App\Models\ParentCategory,id',
            'name' => 'required|string',
            'icon' => 'required|string',
        ]);

        $data = $request->only('icon', 'name', 'parent_category_id');

        $data['user_id'] = $request->user()->id;

        $category = new Category();
        $category->fill($data);
        $category->save();

        return response()->json(['id' => $category->id]);
    }

    public function update(Request $request, $id)
    {
        $this->validate($request, [
            'parent_category_id' => 'required|integer|exists:App\Models\ParentCategory,id',
            'name' => 'required|string',
            'icon' => 'required|string',
        ]);

        $data = $request->only('icon', 'name', 'parent_category_id');

        $data['user_id'] = $request->user()->id;

        $category = Category::find($id);
        $category->fill($data);
        $category->save();

        return response()->json($category);
    }

}
