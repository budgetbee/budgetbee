<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

use Illuminate\Http\Request;
use App\Http\Controllers\AuthController;
use App\Models\Types\Currency;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get params
$username = $argv[1] ?? null;
$useremail = $argv[2] ?? null;
$userpassword = $argv[3] ?? null;

$userController = new AuthController();

$request = new Request([
    'name' => $username,
    'email' => $useremail,
    'password' => $userpassword,
    'confirm_password' => $userpassword,
    'currency_id' => Currency::where('code', 'USD')->first()->id
]);

$response = $userController->register($request);
 
echo PHP_EOL;
echo PHP_EOL;
echo "User created successfully!";
echo PHP_EOL;
echo PHP_EOL;

$app->terminate();
