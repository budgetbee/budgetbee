<?php

require __DIR__.'../vendor/autoload.php';

use GuzzleHttp\Client;

// Obtén los parámetros de línea de comandos
$email = $argv[1] ?? null;
$password = $argv[2] ?? null;

// Crea una instancia del cliente Guzzle HTTP
$client = new Client();

// Realiza la solicitud POST al endpoint '/register' en tu aplicación Laravel
$response = $client->post('http://localhost/api/register', [
    'form_params' => [
        'email' => $email,
        'password' => $password,
    ],
]);

// Obtén el cuerpo de la respuesta
$body = $response->getBody();

// Muestra la respuesta
echo $body;

