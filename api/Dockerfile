FROM php:8.2-fpm-alpine3.17

# Install cron
RUN apk add --no-cache dcron

# Install composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Install gd and zip extensions
RUN apk add --no-cache libpng-dev zlib-dev libzip-dev \
    && docker-php-ext-install gd zip

# Install other extensions
RUN docker-php-ext-install mysqli pdo_mysql

# Install memcached
ENV MEMCACHED_DEPS zlib-dev libmemcached-dev cyrus-sasl-dev
RUN apk add --no-cache --update libmemcached-libs zlib
RUN set -xe \
    && apk add --no-cache --update --virtual .phpize-deps $PHPIZE_DEPS \
    && apk add --no-cache --update --virtual .memcached-deps $MEMCACHED_DEPS \
    && pecl install memcached \
    && echo "extension=memcached.so" > /usr/local/etc/php/conf.d/20_memcached.ini \
    && rm -rf /usr/share/php7 \
    && rm -rf /tmp/* \
    && apk del .memcached-deps .phpize-deps

# Set working directory
WORKDIR /var/www/html

# Copy the application files
COPY . .

# Set permissions
RUN chmod -R 777 storage bootstrap/cache \
    && chmod +x ./entrypoint.sh

# Install dependencies
RUN composer install --no-dev --optimize-autoloader
