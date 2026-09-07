FROM php:8.4-fpm-bookworm

RUN apt-get update && apt-get install -y --no-install-recommends libicu-dev libzip-dev libonig-dev unzip \
    && docker-php-ext-install -j$(nproc) bcmath intl mbstring pdo_mysql zip opcache \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /app/backend
COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --prefer-dist --no-interaction
COPY backend/ ./
RUN composer dump-autoload --no-dev --optimize --no-scripts \
    && php artisan package:discover \
    && chown -R www-data:www-data storage bootstrap/cache
COPY docker/start-api.sh /usr/local/bin/start-api
CMD ["sh", "/usr/local/bin/start-api"]
