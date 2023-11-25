#!/bin/bash

if [[ ! -z $APP_ENV ]]; then 
    echo "App env: " "$APP_ENV"
    if [[ "$APP_ENV" == "local" ]]; then
        chmod -R 775 storage bootstrap/cache 
        chown -R www-data storage bootstrap/cache
        composer install --no-dev --optimize-autoloader
    fi
fi

# Run key:generate
# php artisan key:generate

# Run migrate --seed
php artisan migrate --force --seed

# Start the PHP-FPM server
php-fpm