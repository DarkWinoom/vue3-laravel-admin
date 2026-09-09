<?php

namespace App\Modules\Identity\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessCommands;
use App\Modules\Audit\Application\AuditRecorder;
use Illuminate\Support\Facades\DB;

final class UserCommands
{
    public function __construct(private AccessCommands $access, private SessionService $sessions) {}

    /** @param array<string, mixed> $data */
    public function save(User $actor, array $data, ?int $id): User
    {
        return DB::transaction(function () use ($id, $data, $actor) {
            $this->access->lock($data['version']);
            $this->access->authorize($actor, $id ? 'users.update' : 'users.create');
            $user = $id ? User::whereKey($id)->lockForUpdate()->firstOrFail() : new User;
            if ($id) {
                $this->access->protectTarget($actor, $user);
            }
            if (! $data['enabled'] && $id) {
                $this->access->protectLastAdmin($user);
            }
            $user->fill(['name' => $data['name'], 'email' => $data['email']]);
            if (! empty($data['password'])) {
                $user->password = $data['password'];
            }
            // Check the previous enabled state when removing the final administrator role.
            if ($id && array_key_exists('roleIds', $data)) {
                $this->access->authorize($actor, 'roles.update');
                $this->access->assign($user, $data['roleIds'], $actor);
            }
            $user->enabled = $data['enabled'];
            $user->save();
            if (! $id && ! empty($data['roleIds'])) {
                $this->access->authorize($actor, 'roles.update');
                $this->access->assign($user, $data['roleIds'], $actor);
            }
            if (! $user->enabled || ! empty($data['password'])) {
                $this->sessions->revokeUser($user->id);
            }
            DB::table('access_state')->where('id', 1)->increment('version');

            app(AuditRecorder::class)->record($id ? 'user.updated' : 'user.created', $actor, $user->id, [...$data, 'passwordChanged' => ! empty($data['password'])]);

            return $user;
        });

    }

    public function delete(User $actor, int $id, int $version): void
    {
        DB::transaction(function () use ($actor, $id, $version) {
            $this->access->lock($version);
            $this->access->authorize($actor, 'users.delete');
            $user = User::whereKey($id)->lockForUpdate()->firstOrFail();
            $this->access->protectTarget($actor, $user);
            $this->access->protectLastAdmin($user);
            $this->access->record('user.roles', ['id' => $user->id, 'roleIds' => []], $actor);
            $user->delete();
            app(AuditRecorder::class)->record('user.deleted', $actor, $id);
        });

    }
}
