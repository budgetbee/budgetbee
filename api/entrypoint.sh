#!/bin/bash

# Install dependencies
composer install --no-dev --optimize-autoloader

# Sleep for wait to db container
sleep 20;

# Run key:generate
# php artisan key:generate

# Run migrate --seed
php artisan migrate --force --seed

# Start the PHP-FPM server
php-fpm