#!/bin/bash

# Run key:generate
# php artisan key:generate

# Run migrate --seed
php artisan migrate --force --seed

# Start the PHP-FPM server
php-fpm