<?php

namespace App\Modules\Access\Application;

use App\Models\User;
use App\Modules\Navigation\Application\DefaultMenus;
use App\Shared\ApiException;
use Illuminate\Support\Facades\DB;

final class InitializeAdmin
{
    public function handle(string $email, string $name, string $password): User
    {
        return DB::transaction(function () use ($email, $name, $password) {
            $commands = app(AccessCommands::class);
            $commands->lock();
            if (DB::table('roles')->where('name', 'admin')->exists()) {
                throw new ApiException(409, 'ALREADY_INITIALIZED', '管理员已初始化，请使用用户管理');
            }
            foreach (AccessCommands::builtInPermissions() as $permission) {
                $commands->record('permission.saved', ['id' => (int) DB::table('permissions')->max('id') + 1, 'name' => $permission]);
            }
            $roleId = (int) DB::table('roles')->max('id') + 1;
            $commands->record('role.saved', ['id' => $roleId, 'name' => 'admin', 'permissionIds' => DB::table('permissions')->pluck('id')->all()]);
            $user = User::create(['name' => $name, 'email' => $email, 'password' => $password, 'enabled' => true]);
            $commands->assign($user, [$roleId], null);
            DefaultMenus::install();

            return $user;
        });
    }
}
