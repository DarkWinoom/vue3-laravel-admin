<?php

namespace Tests\Fixtures;

use App\Modules\Access\Application\InitializeAdmin;
use Illuminate\Database\Seeder;

final class BrowserSeeder extends Seeder
{
    public function run(InitializeAdmin $initialize): void
    {
        if (! app()->environment('testing') || ! str_ends_with(config('database.connections.mysql.database'), '_testing')) {
            throw new \RuntimeException('Browser fixtures require the dedicated testing database.');
        }
        $initialize->handle('browser-admin@example.test', 'Browser Admin', 'Browser-test-password!');
    }
}
