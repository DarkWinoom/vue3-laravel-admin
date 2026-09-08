<?php

namespace App\Modules\Access\Application;

use App\Models\User;
use App\Modules\Access\Domain\AccessAggregate;
use App\Shared\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

final class AccessCommands
{
    public function __construct(private AccessQuery $query) {}

    /** @return list<string> */
    public static function builtInPermissions(): array
    {
        $permissions = [];
        foreach (['users', 'roles', 'permissions', 'menus'] as $resource) {
            foreach (['read', 'create', 'update', 'delete'] as $action) {
                $permissions[] = "$resource.$action";
            }
        }

        return $permissions;
    }

    public function lock(?int $version = null): void
    {
        $current = DB::table('access_state')->where('id', 1)->lockForUpdate()->value('version');
        if ($version !== null && (int) $current !== $version) {
            throw new ApiException(409, 'VERSION_CONFLICT', '数据已更新，请刷新后重试');
        }
    }

    public function authorize(User $actor, string $permission): void
    {
        if (! $this->query->allows($actor, $permission)) {
            throw new ApiException(403, 'FORBIDDEN', '没有操作权限');
        }
    }

    public function protectTarget(User $actor, User $target): void
    {
        if (! in_array('admin', $this->query->roles($actor), true) && (in_array('admin', $this->query->roles($target), true) || array_diff($this->query->permissions($target), $this->query->permissions($actor)))) {
            throw new ApiException(403, 'PRIVILEGE_ESCALATION', '不能修改权限范围高于自身的账户');
        }
    }

    /** @param array<string, mixed> $data */
    public function record(string $action, array $data, ?User $actor = null): void
    {
        AccessAggregate::retrieve(AccessAggregate::UUID)->change($action, $data, $actor?->id, (string) Str::uuid())->persist();
        DB::table('access_state')->where('id', 1)->increment('version');
    }

    /** @param list<int> $roleIds */
    public function assign(User $target, array $roleIds, ?User $actor): void
    {
        $roleIds = array_values(array_unique($roleIds));
        if ($actor) {
            $this->protectTarget($actor, $target);
        }
        $existing = DB::table('roles')->whereIn('id', $roleIds)->where('guard_name', 'web')->count();
        if ($existing !== count($roleIds)) {
            throw new ApiException(422, 'INVALID_ROLES', '角色不存在');
        }
        $admin = (int) DB::table('roles')->where('name', 'admin')->where('guard_name', 'web')->value('id');
        if ($actor && ! in_array('admin', $this->query->roles($actor), true)) {
            if ($target->id === $actor->id || in_array($admin, $roleIds, true) || in_array('admin', $this->query->roles($target), true)) {
                throw new ApiException(403, 'PRIVILEGE_ESCALATION', '不能修改自身授权或管理员授权');
            }
            $granted = DB::table('permissions')->join('role_has_permissions as rp', 'rp.permission_id', '=', 'permissions.id')->whereIn('rp.role_id', $roleIds)->pluck('permissions.name')->all();
            if (array_diff($granted, $this->query->permissions($actor))) {
                throw new ApiException(403, 'PRIVILEGE_ESCALATION', '不能分配超出自身范围的权限');
            }
        }
        if (! in_array($admin, $roleIds, true)) {
            $this->protectLastAdmin($target);
        }
        $this->record('user.roles', ['id' => $target->id, 'roleIds' => $roleIds], $actor);
    }

    public function protectLastAdmin(User $target): void
    {
        if (! in_array('admin', $this->query->roles($target), true) || ! $target->enabled) {
            return;
        }
        $other = DB::table('users')->join('model_has_roles as ur', 'ur.model_id', '=', 'users.id')->join('roles', 'roles.id', '=', 'ur.role_id')->where('ur.model_type', User::class)->where('roles.name', 'admin')->where('users.enabled', true)->where('users.id', '<>', $target->id)->exists();
        if (! $other) {
            throw new ApiException(409, 'LAST_ADMIN', '必须保留至少一个可用管理员');
        }
    }

    /** @param array<string, mixed> $data */
    public function save(string $resource, array $data, ?int $id, User $actor): int
    {
        $this->authorize($actor, $resource.'.'.($id ? 'update' : 'create'));
        $old = $id ? DB::table($resource)->where('id', $id)->first() : null;
        if ($id && ! $old) {
            throw new ApiException(404, 'NOT_FOUND', '记录不存在');
        }
        if ($resource === 'roles') {
            if ($data['name'] === 'admin' || $old?->name === 'admin') {
                throw new ApiException(403, 'PROTECTED_ROLE', '系统管理员角色不可修改');
            }
            $names = DB::table('permissions')->whereIn('id', $data['permissionIds'])->pluck('name')->all();
            if (count($names) !== count(array_unique($data['permissionIds']))) {
                throw new ApiException(422, 'INVALID_PERMISSIONS', '权限不存在');
            }
            if (! in_array('admin', $this->query->roles($actor), true)) {
                $ownRole = DB::table('model_has_roles')->where('model_id', $actor->id)->where('model_type', User::class)->where('role_id', $id)->exists();
                $previousPermissions = DB::table('permissions')->join('role_has_permissions as rp', 'rp.permission_id', '=', 'permissions.id')->where('rp.role_id', $id)->pluck('permissions.name')->all();
                if ($ownRole || array_diff([...$names, ...$previousPermissions], $this->query->permissions($actor))) {
                    throw new ApiException(403, 'PRIVILEGE_ESCALATION', '不能修改自身角色或授予超出自身范围的权限');
                }
            }
        } elseif ($old && (in_array($old->name, self::builtInPermissions(), true) || DB::table('role_has_permissions')->where('permission_id', $id)->exists() || DB::table('menus')->where('permission', $old->name)->exists())) {
            throw new ApiException(403, 'PROTECTED_PERMISSION', '内置权限不可修改');
        }
        $id ??= (int) DB::table($resource)->max('id') + 1;
        $this->record($resource === 'roles' ? 'role.saved' : 'permission.saved', [...$data, 'id' => $id], $actor);

        return $id;
    }

    public function delete(string $resource, int $id, User $actor): void
    {
        $this->authorize($actor, $resource.'.delete');
        $item = DB::table($resource)->where('id', $id)->first();
        if (! $item) {
            throw new ApiException(404, 'NOT_FOUND', '记录不存在');
        }
        if ($resource === 'roles') {
            if ($item->name === 'admin' || DB::table('model_has_roles')->where('role_id', $id)->exists()) {
                throw new ApiException(409, 'ROLE_IN_USE', '请先移除角色分配，系统管理员角色不可删除');
            }
        } elseif (in_array($item->name, self::builtInPermissions(), true) || DB::table('role_has_permissions')->where('permission_id', $id)->exists() || DB::table('menus')->where('permission', $item->name)->exists()) {
            throw new ApiException(409, 'PERMISSION_IN_USE', '内置或正在使用的权限不可删除');
        }
        $this->record($resource === 'roles' ? 'role.deleted' : 'permission.deleted', ['id' => $id], $actor);
    }
}
