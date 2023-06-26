<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\BalanceController;
use App\Http\Controllers\CategoryController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::prefix('account')->group(function () {
    Route::get('', [AccountController::class, 'get']);
    Route::get('type', [AccountController::class, 'getTypes']);
    Route::get('{id}/stocks', [AccountController::class, 'getStocks']);
    Route::get('{id}/record', [AccountController::class, 'getRecords']);
    Route::get('{id}/record/last{number}', [AccountController::class, 'getLastRecords']);
    Route::get('{id}', [AccountController::class, 'getById']);
    Route::post('', [AccountController::class, 'create']);
    Route::post('{id}/adjust', [AccountController::class, 'adjustBalance']);
    Route::post('{id}', [AccountController::class, 'update']);
    Route::delete('{id}', [AccountController::class, 'delete']);
});

Route::prefix('record')->group(function () {
    Route::get('', [RecordController::class, 'get']);
    Route::get('last{number}', [RecordController::class, 'getLastRecords']);
    Route::get('category/{id}', [RecordController::class, 'getRecordsByCategory']);
    Route::get('{id}', [RecordController::class, 'getById']);
    Route::post('', [RecordController::class, 'create']);
    Route::post('{id}', [RecordController::class, 'update']);
    Route::delete('{id}', [RecordController::class, 'delete']);
});

Route::prefix('category')->group(function () {
    Route::get('', [CategoryController::class, 'get']);
    Route::get('parent', [CategoryController::class, 'getParent']);
    Route::get('{id}', [CategoryController::class, 'getById']);
    Route::get('by-parent/{id}', [CategoryController::class, 'getByParentId']);
    Route::get('parent/{id}', [CategoryController::class, 'getParentById']);
    Route::post('', [CategoryController::class, 'create']);
    Route::post('{id}', [CategoryController::class, 'update']);
});

Route::prefix('balance')->group(function () {
    Route::get('', [BalanceController::class, 'getBalance']);
    Route::get('expenses', [BalanceController::class, 'getExpensesBalance']);
    Route::get('expenses/{id}', [BalanceController::class, 'getExpensesBalanceByAccount']);
    Route::get('timeline', [BalanceController::class, 'getTimeline']);
    Route::get('category', [BalanceController::class, 'getBalanceByCategory']);
    Route::get('category/account/{id}', [BalanceController::class, 'getBalanceByCategoryAndAccount']);
    Route::get('categories', [BalanceController::class, 'getByCategories']);
    Route::get('categories/{id}', [BalanceController::class, 'getByCategoriesAndAccount']);
    Route::get('subcategories/{id}', [BalanceController::class, 'getBySubcategories']);
    Route::get('subcategories/{id}/account/{accountId}', [BalanceController::class, 'getBySubcategoriesAndAccount']);
    Route::get('{id}', [BalanceController::class, 'getBalanceByAccount']);
    Route::get('timeline/{id}', [BalanceController::class, 'getTimelineByAccount']);
});
