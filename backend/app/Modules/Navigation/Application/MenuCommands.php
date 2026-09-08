<?php

namespace App\Modules\Navigation\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessCommands;
use App\Shared\ApiException;
use Illuminate\Support\Facades\DB;

final class MenuCommands
{
    public function __construct(private AccessCommands $access) {}

    /** @param array<string, mixed> $data */
    public function save(User $actor, array $data, ?int $id): int
    {
        return DB::transaction(function () use ($actor, $data, $id) {
            $this->access->lock($data['version']);
            $this->access->authorize($actor, $id ? 'menus.update' : 'menus.create');
            if ($id && ! DB::table('menus')->where('id', $id)->exists()) {
                throw new ApiException(404, 'NOT_FOUND', '菜单不存在');
            }
            $parent = ! empty($data['parent_id']) ? DB::table('menus')->where('id', $data['parent_id'])->first() : null;
            if ($parent && ($parent->parent_id || $parent->component !== 'group' || $parent->id === $id || $data['component'] === 'group')) {
                throw new ApiException(422, 'INVALID_PARENT', '菜单仅支持顶级分组及其页面子项');
            }
            if (($parent && (! str_starts_with($data['name'], $parent->name.'_') || ! str_starts_with($data['path'], $parent->path.'/'))) || (! $parent && str_contains($data['name'], '_'))) {
                throw new ApiException(422, 'INVALID_ROUTE', '顶级名称不能含下划线；子菜单名称和路径须以上级名称_和上级路径/开头');
            }
            if ($id && DB::table('menus')->where('parent_id', $id)->exists()) {
                $previous = DB::table('menus')->where('id', $id)->first();
                if ($previous->name !== $data['name'] || $previous->path !== $data['path']) {
                    throw new ApiException(409, 'MENU_HAS_CHILDREN', '含子菜单的分组不能更改名称或路径');
                }
            }
            if ($id && $data['component'] !== 'group' && DB::table('menus')->where('parent_id', $id)->exists()) {
                throw new ApiException(409, 'MENU_HAS_CHILDREN', '请先移动或删除子菜单');
            }
            unset($data['version']);
            $data['updated_at'] = now();
            if ($id) {
                DB::table('menus')->where('id', $id)->update($data);
            } else {
                $id = DB::table('menus')->insertGetId([...$data, 'created_at' => now()]);
            }
            DB::table('access_state')->where('id', 1)->increment('version');

            return $id;
        });

    }

    public function delete(User $actor, int $id, int $version): void
    {
        DB::transaction(function () use ($actor, $id, $version) {
            $this->access->lock($version);
            $this->access->authorize($actor, 'menus.delete');
            if (DB::table('menus')->where('parent_id', $id)->exists()) {
                throw new ApiException(409, 'MENU_HAS_CHILDREN', '请先删除子菜单');
            }
            if (! DB::table('menus')->where('id', $id)->delete()) {
                throw new ApiException(404, 'NOT_FOUND', '菜单不存在');
            }
            DB::table('access_state')->where('id', 1)->increment('version');
        });

    }
}
