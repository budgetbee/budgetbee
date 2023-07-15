<?php

require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';

use App\Models\User;
use Illuminate\Support\Facades\Hash;

$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Get params
$username = $argv[1] ?? null;
$useremail = $argv[2] ?? null;
$userpassword = $argv[3] ?? null;

// Create a new user
$user = new User();
$user->name = $username;
$user->email = $useremail;
$user->password = Hash::make($userpassword);

$user->save();

echo PHP_EOL;
echo PHP_EOL;
echo "User created successfully!";
echo PHP_EOL;
echo PHP_EOL;

$app->terminate();
