<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\AppVersionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\BalanceController;
use App\Http\Controllers\BudgetController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ImportController;
use App\Http\Controllers\RecordController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\AiController;
use App\Http\Controllers\ApiKeyController;
use App\Http\Controllers\ExternalApiController;
use App\Http\Controllers\UpcomingExpenseController;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);

Route::get('version', [AppVersionController::class, 'get'])->middleware('auth:sanctum');

Route::prefix('user')->middleware('auth:sanctum')->group(function () {
    Route::get('all', [UserController::class, 'getAll']);
    Route::get('isAdmin', [UserController::class, 'checkIfAdmin']);
    Route::get('settings', [UserController::class, 'getSettings']);
    Route::get('currencies', [UserController::class, 'getCurrencies']);
    Route::get('currencies/all', [UserController::class, 'getAllCurrencies']);
    Route::get('{id?}', [UserController::class, 'get']);
    Route::post('register', [AuthController::class, 'register']);
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('settings', [UserController::class, 'updateSettings']);
    Route::post('currencies', [UserController::class, 'createCurrency']);
    Route::post('currencies/{id}', [UserController::class, 'updateCurrency']);
    Route::post('{id}', [UserController::class, 'update']);
});

Route::prefix('account')->middleware('auth:sanctum')->group(function () {
    Route::get('', [AccountController::class, 'get']);
    Route::get('type', [AccountController::class, 'getTypes']);
    Route::get('{id}/stocks', [AccountController::class, 'getStocks']);
    Route::get('{id}/record', [AccountController::class, 'getRecords']);
    Route::get('{id}/record/last{number}', [AccountController::class, 'getLastRecords']);
    Route::get('currencies', [AccountController::class, 'getCurrencies']);
    Route::get('{id}', [AccountController::class, 'getById']);
    Route::post('', [AccountController::class, 'create']);
    Route::post('reorder', [AccountController::class, 'reorder']);
    Route::post('{id}/adjust', [AccountController::class, 'adjustBalance']);
    Route::post('{id}', [AccountController::class, 'update']);
    Route::delete('{id}', [AccountController::class, 'delete']);
});

Route::prefix('record')->middleware('auth:sanctum')->group(function () {
    Route::get('', [RecordController::class, 'get']);
    Route::get('last', [RecordController::class, 'getLastRecords']);
    Route::get('category/{id}', [RecordController::class, 'getRecordsByCategory']);
    Route::get('{id}', [RecordController::class, 'getById']);
    Route::post('', [RecordController::class, 'create']);
    Route::post('{id}', [RecordController::class, 'update']);
    Route::delete('{id}', [RecordController::class, 'delete']);
});

Route::prefix('category')->middleware('auth:sanctum')->group(function () {
    Route::get('', [CategoryController::class, 'get']);
    Route::get('parent', [CategoryController::class, 'getParent']);
    Route::get('{id}', [CategoryController::class, 'getById']);
    Route::get('by-parent/{id}', [CategoryController::class, 'getByParentId']);
    Route::get('parent/{id}', [CategoryController::class, 'getParentById']);
    Route::post('', [CategoryController::class, 'create']);
    Route::post('{id}', [CategoryController::class, 'update']);
});

Route::prefix('balance')->middleware('auth:sanctum')->group(function () {
    Route::get('', [BalanceController::class, 'getBalance']);
    Route::get('all', [BalanceController::class, 'getAll']);
    Route::get('expenses', [BalanceController::class, 'getExpensesBalance']);
    Route::get('timeline', [BalanceController::class, 'getTimeline']);
    Route::get('category', [BalanceController::class, 'getBalanceByCategory']);
    Route::get('categories/income', [BalanceController::class, 'getByIncomeCategories']);
    Route::get('categories/expense', [BalanceController::class, 'getByExpenseCategories']);
    Route::get('categories/top', [BalanceController::class, 'getTopExpenses']);
    Route::get('subcategories/{id}', [BalanceController::class, 'getBySubcategories']);
    Route::get('subcategories/{id}/account/{accountId}', [BalanceController::class, 'getBySubcategoriesAndAccount']);
});

Route::prefix('import')->middleware('auth:sanctum')->group(function () {
    Route::post('', [ImportController::class, 'import']);
});

Route::prefix('budget')->middleware('auth:sanctum')->group(function () {
    Route::get('', [BudgetController::class, 'getAll']);
    Route::get('{id}', [BudgetController::class, 'getById']);
    Route::post('', [BudgetController::class, 'create']);
    Route::post('{id}', [BudgetController::class, 'update']);
    Route::delete('{id}', [BudgetController::class, 'delete']);
});


Route::prefix('ai')->middleware('auth:sanctum')->group(function () {
    Route::post('/predict-category', [AiController::class, 'predictCategoryRequest']);
});

Route::prefix('api-keys')->middleware('auth:sanctum')->group(function () {
    Route::get('', [ApiKeyController::class, 'index']);
    Route::post('', [ApiKeyController::class, 'store']);
    Route::delete('{id}', [ApiKeyController::class, 'destroy']);
});

Route::prefix('upcoming-expenses')->middleware('auth:sanctum')->group(function () {
    Route::get('', [UpcomingExpenseController::class, 'getAll']);
    Route::get('{id}', [UpcomingExpenseController::class, 'getById']);
    Route::post('', [UpcomingExpenseController::class, 'create']);
    Route::post('{id}', [UpcomingExpenseController::class, 'update']);
    Route::delete('{id}', [UpcomingExpenseController::class, 'delete']);
});

Route::prefix('v1/external')->middleware('auth.apikey')->group(function () {
    // Records CRUD
    Route::get('records', [ExternalApiController::class, 'getRecords']);
    Route::get('records/{id}', [ExternalApiController::class, 'getRecord']);
    Route::post('records', [ExternalApiController::class, 'createRecord']);
    Route::put('records/{id}', [ExternalApiController::class, 'updateRecord']);
    Route::delete('records/{id}', [ExternalApiController::class, 'deleteRecord']);

    // Accounts (read-only)
    Route::get('accounts', [ExternalApiController::class, 'getAccounts']);
    Route::get('accounts/{id}', [ExternalApiController::class, 'getAccount']);
    Route::get('account-types', [ExternalApiController::class, 'getAccountTypes']);

    // Categories (read-only)
    Route::get('categories', [ExternalApiController::class, 'getCategories']);
    Route::get('categories/{id}', [ExternalApiController::class, 'getCategory']);
    Route::get('parent-categories', [ExternalApiController::class, 'getParentCategories']);
    Route::get('parent-categories/{id}', [ExternalApiController::class, 'getParentCategory']);
    Route::get('parent-categories/{id}/categories', [ExternalApiController::class, 'getCategoriesByParent']);
});

