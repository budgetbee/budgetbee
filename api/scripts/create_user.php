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

if (!$username || !$useremail || !$userpassword) {
    fwrite(STDERR, "Usage: php scripts/create_user.php <name> <email> <password>" . PHP_EOL);
    exit(1);
}

$userController = new AuthController();

$request = new Request([
    'name' => $username,
    'email' => $useremail,
    'password' => $userpassword,
    'confirm_password' => $userpassword
]);

try {
    $response = $userController->register($request);

    $statusCode = method_exists($response, 'getStatusCode') ? $response->getStatusCode() : 200;
    if ($statusCode < 200 || $statusCode >= 300) {
        fwrite(STDERR, "Failed to create user. Status code: {$statusCode}" . PHP_EOL);
        if (method_exists($response, 'getContent')) {
            fwrite(STDERR, (string) $response->getContent() . PHP_EOL);
        }
        exit(1);
    }

    echo PHP_EOL;
    echo PHP_EOL;
    echo "User created successfully!";
    echo PHP_EOL;
    echo PHP_EOL;
} catch (\Throwable $e) {
    fwrite(STDERR, "Failed to create user: " . $e->getMessage() . PHP_EOL);
    exit(1);
} finally {
    $app->terminate();
}
