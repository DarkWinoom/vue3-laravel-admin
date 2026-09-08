<?php

namespace App\Modules\Access\Infrastructure;

use App\Models\User;
use App\Modules\Access\Domain\AccessChanged;
use Illuminate\Support\Facades\DB;
use Spatie\EventSourcing\EventHandlers\Projectors\Projector;
use Spatie\Permission\PermissionRegistrar;

final class AccessProjector extends Projector
{
    public function onAccessChanged(AccessChanged $event): void
    {
        $data = $event->data;
        switch ($event->action) {
            case 'permission.saved':
                DB::table('permissions')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'guard_name' => 'web', 'created_at' => $event->createdAt(), 'updated_at' => $event->createdAt()]);
                break;
            case 'permission.deleted':
                DB::table('permissions')->where('id', $data['id'])->delete();
                break;
            case 'role.saved':
                DB::table('roles')->updateOrInsert(['id' => $data['id']], ['name' => $data['name'], 'guard_name' => 'web', 'created_at' => $event->createdAt(), 'updated_at' => $event->createdAt()]);
                DB::table('role_has_permissions')->where('role_id', $data['id'])->delete();
                foreach ($data['permissionIds'] as $permissionId) {
                    DB::table('role_has_permissions')->insert(['role_id' => $data['id'], 'permission_id' => $permissionId]);
                }
                break;
            case 'role.deleted':
                DB::table('roles')->where('id', $data['id'])->delete();
                break;
            case 'user.roles':
                DB::table('model_has_roles')->where('model_type', User::class)->where('model_id', $data['id'])->delete();
                foreach ($data['roleIds'] as $roleId) {
                    DB::table('model_has_roles')->insert(['model_type' => User::class, 'model_id' => $data['id'], 'role_id' => $roleId]);
                }
                break;
        }
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function resetState(): void
    {
        DB::table('model_has_roles')->where('model_type', User::class)->delete();
        DB::table('roles')->where('guard_name', 'web')->delete();
        DB::table('permissions')->where('guard_name', 'web')->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
