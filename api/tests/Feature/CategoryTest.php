<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;
use App\Models\User;
use App\Events\UserCreated;
use App\Models\Category;
use App\Models\ParentCategory;

class GetCategoryTest extends TestCase
{
    private $user;

    public function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create(['password' => 'UserTest123']);

        event(new UserCreated($this->user));

        $this->actingAs($this->user);
    }

    public function tearDown(): void
    {
        $this->user->delete();

        parent::tearDown();
    }

    public function testGetCategories(): void
    {
        $response = $this->get('/api/category');

        $response->assertStatus(200);
    }

    public function testGetCategoryById(): void
    {
        $category = Category::where('user_id', $this->user->id)->first();
        $response = $this->get('/api/category/' . $category->id);

        $response->assertStatus(200);
    }

    public function testGetCategoryByIdFail(): void
    {
        $response = $this->get('/api/category/9999999');

        $response->assertStatus(403);
    }

    public function testGetParentCategories(): void
    {
        $response = $this->get('/api/category/parent');

        $response->assertStatus(200);
    }

    public function testGetCategoriesByParent(): void
    {
        $parentCategory = ParentCategory::where('user_id', $this->user->id)->first();
        $response = $this->get('/api/category/by-parent/' . $parentCategory->id);

        $response->assertStatus(200);
    }

    public function testGetParentById(): void
    {
        $parentCategory = ParentCategory::where('user_id', $this->user->id)->first();
        $response = $this->get('/api/category/parent/' . $parentCategory->id);

        $response->assertStatus(200);
    }

    public function testCreateCategory(): void
    {
        $parentCategory = ParentCategory::where('user_id', $this->user->id)->first();
        $response = $this->post('/api/category/', [
            'parent_category_id' => $parentCategory->id,
            'name' => 'CategoryTest',
            'icon' => 'fa-fa'
        ]);

        $response->assertStatus(200);
    }

    public function testCreateCategoryFail(): void
    {
        $response = $this->post('/api/category/', [
            'parent_category_id' => -1,
            'name' => 'CategoryTest',
            'icon' => 'fa-fa'
        ]);

        $response->assertStatus(302);
    }

    public function testUpdateCategory(): void
    {
        $parentCategory = ParentCategory::where('user_id', $this->user->id)->first();
        $response = $this->post('/api/category/' . $parentCategory->id, [
            'parent_category_id' => $parentCategory->id,
            'name' => 'CategoryTestModified',
            'icon' => 'fa-fa'
        ]);
        
        $response->assertStatus(200);

        $response = $this->get('/api/category/' . $response->getData()->id);
        $response->assertStatus(200);

    }

    public function testUpdateCategoryFail(): void
    {
        $response = $this->post('/api/category/' . -1, [
            'parent_category_id' => -1,
            'name' => 'CategoryTestModified',
            'icon' => 'fa-fa'
        ]);

        $response->assertStatus(302);
    }


}
