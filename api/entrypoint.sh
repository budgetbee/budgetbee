#!/bin/bash

# Set permissions
chmod -R 775 storage bootstrap/cache 
chown -R www-data:www-data storage bootstrap/cache

chown www-data:www-data ./entrypoint.sh 
chmod +x ./entrypoint.sh

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