<?php

namespace App\Modules\Access\Application;

use App\Models\User;
use Closure;
use Illuminate\Support\Facades\DB;

final class AccessQuery
{
    /**
     * @template T
     *
     * @param  Closure(): T  $read
     * @return T
     */
    public function snapshot(Closure $read): mixed
    {
        return DB::transaction(function () use ($read) {
            DB::table('access_state')->where('id', 1)->sharedLock()->first();

            return $read();
        });
    }

    /** @return list<string> */
    public function roles(User $user): array
    {
        return DB::table('roles')->join('model_has_roles as ur', 'ur.role_id', '=', 'roles.id')->where('ur.model_type', User::class)->where('ur.model_id', $user->id)->pluck('roles.name')->all();
    }

    /** @return list<string> */
    public function permissions(User $user): array
    {
        if (in_array('admin', $this->roles($user), true)) {
            return DB::table('permissions')->where('guard_name', 'web')->pluck('name')->all();
        }

        return DB::table('permissions as p')->join('role_has_permissions as rp', 'rp.permission_id', '=', 'p.id')->join('model_has_roles as ur', 'ur.role_id', '=', 'rp.role_id')->where('ur.model_type', User::class)->where('ur.model_id', $user->id)->distinct()->pluck('p.name')->all();
    }

    public function allows(User $user, string $permission): bool
    {
        return (bool) User::whereKey($user->id)->value('enabled') && in_array($permission, $this->permissions($user), true);
    }

    public function version(): int
    {
        return (int) DB::table('access_state')->where('id', 1)->value('version');
    }

    /** @return array<string, mixed> */
    public function identity(User $user): array
    {
        return ['userId' => (string) $user->id, 'userName' => $user->name, 'email' => $user->email, 'roles' => $this->roles($user), 'buttons' => $this->permissions($user), 'accessVersion' => $this->version()];
    }
}
