<?php

return [
    'paths' => ['api/*'],
    'allowed_methods' => ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    'allowed_origins' => (require __DIR__.'/identity.php')['origins'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Accept', 'Authorization', 'Content-Type', 'X-CSRF-Token'],
    'exposed_headers' => [],
    'max_age' => 600,
    'supports_credentials' => true,
];
