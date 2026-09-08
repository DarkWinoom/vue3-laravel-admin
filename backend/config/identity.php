<?php

return [
    'issuer' => env('JWT_ISSUER', 'vue3-laravel-admin'),
    'audience' => 'admin-api',
    'access_minutes' => (int) env('JWT_TTL', 15),
    'refresh_minutes' => (int) env('REFRESH_TTL', 10080),
    'secure_cookie' => env('APP_ENV') === 'production',
    'origins' => array_filter(explode(',', env('AUTH_ALLOWED_ORIGINS', env('APP_ENV') === 'production' ? env('APP_URL', '') : implode(',', [
        env('APP_URL', 'http://localhost:8000'),
        'http://localhost:'.env('DEV_FRONTEND_PORT', 9527),
        'http://127.0.0.1:'.env('DEV_FRONTEND_PORT', 9527),
        'tauri://localhost', 'http://tauri.localhost', 'https://tauri.localhost',
    ])))),
];
