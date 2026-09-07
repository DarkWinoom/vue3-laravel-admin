#!/bin/sh
set -eu
php artisan migrate --force
exec php-fpm
