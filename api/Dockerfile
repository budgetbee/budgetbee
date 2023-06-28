FROM php:8.1.9-fpm-alpine3.16

# Instalar paquete cron
RUN apk add --no-cache dcron

# Instalar composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Instalar extensiones gd y zip
RUN apk add --no-cache libpng-dev zlib-dev libzip-dev \
    && docker-php-ext-install gd zip

# Instalar extensiones adicionales
RUN docker-php-ext-install mysqli pdo_mysql

# Instalar memcached
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
