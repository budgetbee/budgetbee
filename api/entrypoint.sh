#!/bin/bash

if [[ ! -z $APP_ENV ]]; then 
    echo "App env: " "$APP_ENV"
    if [[ "$APP_ENV" == "local" ]]; then
        chmod -R 775 storage bootstrap/cache 
        chown -R www-data storage bootstrap/cache
        composer install --no-dev --optimize-autoloader
    fi
fi

# Generate APP_KEY only if not already set
CURRENT_KEY=$(grep "^APP_KEY=" .env | cut -d= -f2)
if [ -z "$CURRENT_KEY" ]; then
    echo "No APP_KEY found, generating a new one..."
    php artisan key:generate
else
    echo "APP_KEY already set, skipping key:generate"
fi

# Run migrate --seed
php artisan migrate --force --seed

# Start the PHP-FPM server
php-fpm