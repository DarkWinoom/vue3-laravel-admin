<?php

return [
    'enabled' => env('API_DOCS_ENABLED', env('APP_ENV', 'production') !== 'production'),
];
