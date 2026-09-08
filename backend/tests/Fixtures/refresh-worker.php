<?php

use App\Modules\Identity\Application\SessionService;
use App\Shared\ApiException;
use Illuminate\Contracts\Console\Kernel;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();
if (! $app->environment('testing') || ! str_ends_with(config('database.connections.mysql.database'), '_testing')) {
    throw new RuntimeException('Concurrency worker requires a dedicated testing database.');
}
$credential = trim(file_get_contents($argv[1]));
echo "READY\n";
flush();
try {
    app(SessionService::class)->refresh($credential, 'desktop', '');
    echo "OK\n";
} catch (ApiException $exception) {
    echo $exception->errorCode."\n";
}
