<?php

namespace App\Modules\Access\Application;

use App\Models\User;
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
            foreach (['users' => '用户管理', 'roles' => '角色管理', 'permissions' => '权限管理', 'menus' => '菜单管理'] as $key => $title) {
                DB::table('menus')->insert(['name' => $key, 'title' => $title, 'path' => '/'.$key, 'component' => $key, 'permission' => $key.'.read', 'icon' => 'mdi:menu', 'sort' => 10, 'enabled' => true, 'created_at' => now(), 'updated_at' => now()]);
            }

            return $user;
        });
    }
}
