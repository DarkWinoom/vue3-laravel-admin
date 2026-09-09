<?php

namespace Tests\Fixtures;

use App\Models\User;
use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\InitializeAdmin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

final class BrowserSeeder extends Seeder
{
    public function run(InitializeAdmin $initialize): void
    {
        if (! app()->environment('testing') || ! str_ends_with(config('database.connections.mysql.database'), '_testing')) {
            throw new \RuntimeException('Browser fixtures require the dedicated testing database.');
        }
        DB::transaction(function () use ($initialize) {
            $commands = app(AccessCommands::class);
            $commands->lock();
            $admin = User::where('email', 'browser-admin@example.test')->first()
                ?? $initialize->handle('browser-admin@example.test', 'Browser Admin', 'Browser-test-password!');
            if (User::where('email', 'browser-viewer@example.test')->exists()) {
                return;
            }
            $roleId = $commands->save('roles', ['name' => 'browser_reader', 'permissionIds' => DB::table('permissions')->where('name', 'users.read')->pluck('id')->all()], null, $admin);
            $viewer = User::create(['name' => 'Browser Viewer', 'email' => 'browser-viewer@example.test', 'password' => 'Browser-test-password!', 'enabled' => true]);
            $commands->assign($viewer, [$roleId], $admin);
        });
    }
}
