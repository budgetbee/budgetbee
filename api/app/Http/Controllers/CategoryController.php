<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\ParentCategory;
use Illuminate\Http\Request;

class CategoryController extends Controller
{

    public function get(Request $request)
    {
        $categories = Category::where('user_id', $request->user()->id)
            ->orderBy('position')->orderBy('id')
            ->get();

        return response()->json($categories);
    }

    public function getByParentId(Request $request, $id)
    {
        $categories = Category::where('parent_category_id', $id)
            ->where('user_id', $request->user()->id)
            ->orderBy('position')->orderBy('id')
            ->get();

        return response()->json($categories);
    }

    public function getById($id)
    {
        $category = Category::find($id);

        $this->authorize('view', $category);

        return response()->json($category);
    }

    // ---------------- Ordering ----------------

    public function reorderParents(Request $request)
    {
        $this->validate($request, [
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.position' => 'required|integer',
        ]);

        foreach ($request->input('items') as $item) {
            ParentCategory::where('user_id', $request->user()->id)
                ->where('id', $item['id'])
                ->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Order updated']);
    }

    public function reorder(Request $request)
    {
        $this->validate($request, [
            'items' => 'required|array',
            'items.*.id' => 'required|integer',
            'items.*.position' => 'required|integer',
        ]);

        foreach ($request->input('items') as $item) {
            Category::where('user_id', $request->user()->id)
                ->where('id', $item['id'])
                ->update(['position' => $item['position']]);
        }

        return response()->json(['message' => 'Order updated']);
    }

    // ---------------- Parent categories ----------------

    public function getParent(Request $request)
    {
        $categories = ParentCategory::where('user_id', $request->user()->id)
            ->ordered()
            ->get();

        return response()->json($categories);
    }

    public function getParentById(Request $request, $id)
    {
        $parentCategory = ParentCategory::where('user_id', $request->user()->id)
            ->find($id);

        return response()->json($parentCategory);
    }

    public function createParent(Request $request)
    {
        $this->validate($request, [
            'name' => 'required|string',
            'color' => 'required|string',
            'icon' => 'required|string',
            'type' => 'sometimes|in:income,expense',
            'enabled' => 'nullable|boolean',
            'position' => 'nullable|integer',
        ]);

        $data = $request->only('name', 'color', 'icon', 'type', 'enabled', 'position');

        $data['user_id'] = $request->user()->id;
        if (!array_key_exists('position', $data) || $data['position'] === null) {
            $data['position'] = ParentCategory::where('user_id', $data['user_id'])->max('position') + 1;
        }
        if (!array_key_exists('enabled', $data) || $data['enabled'] === null) {
            $data['enabled'] = true;
        }

        $category = new ParentCategory();
        $category->fill($data);
        $category->save();

        return response()->json($category, 201);
    }

    public function updateParent(Request $request, $id)
    {
        $category = ParentCategory::where('user_id', $request->user()->id)->find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $this->validate($request, [
            'name' => 'sometimes|string',
            'color' => 'sometimes|string',
            'icon' => 'sometimes|string',
            'type' => 'sometimes|in:income,expense',
            'enabled' => 'sometimes|boolean',
            'position' => 'sometimes|integer',
        ]);

        $data = $request->only('name', 'color', 'icon', 'type', 'enabled', 'position');

        $category->fill(array_filter($data, fn ($value) => $value !== null));
        $category->save();

        return response()->json($category);
    }

    // ---------------- Sub categories ----------------

    public function create(Request $request)
    {
        $this->validate($request, [
            'parent_category_id' => 'required|integer|exists:App\Models\ParentCategory,id',
            'name' => 'required|string',
            'icon' => 'required|string',
            'enabled' => 'nullable|boolean',
            'position' => 'nullable|integer',
        ]);

        $parent = ParentCategory::where('user_id', $request->user()->id)
            ->find($request->input('parent_category_id'));

        if (!$parent) {
            return response()->json(['message' => 'Parent category not found'], 422);
        }

        $data = $request->only('icon', 'name', 'parent_category_id', 'enabled', 'position');

        $data['user_id'] = $request->user()->id;
        if (!array_key_exists('position', $data) || $data['position'] === null) {
            $data['position'] = Category::where('parent_category_id', $data['parent_category_id'])->max('position') + 1;
        }
        if (!array_key_exists('enabled', $data) || $data['enabled'] === null) {
            $data['enabled'] = true;
        }

        $category = new Category();
        $category->fill($data);
        $category->save();

        return response()->json(['id' => $category->id]);
    }

    public function update(Request $request, $id)
    {
        $category = Category::where('user_id', $request->user()->id)->find($id);

        if (!$category) {
            return response()->json(['message' => 'Category not found'], 404);
        }

        $this->validate($request, [
            'parent_category_id' => 'sometimes|integer|exists:App\Models\ParentCategory,id',
            'name' => 'sometimes|string',
            'icon' => 'sometimes|string',
            'enabled' => 'sometimes|boolean',
            'position' => 'sometimes|integer',
        ]);

        $data = $request->only('icon', 'name', 'parent_category_id', 'enabled', 'position');

        $category->fill(array_filter($data, fn ($value) => $value !== null));
        $category->save();

        return response()->json($category);
    }
}
