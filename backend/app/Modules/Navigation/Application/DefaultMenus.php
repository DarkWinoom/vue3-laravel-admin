<?php

namespace App\Modules\Navigation\Application;

use Illuminate\Support\Facades\DB;

final class DefaultMenus
{
    public const ITEMS = [
        'users' => ['manage_user', '/manage/user', '用户管理', 'ic:round-manage-accounts'],
        'roles' => ['manage_role', '/manage/role', '角色管理', 'carbon:user-role'],
        'permissions' => ['manage_permission', '/manage/permission', '权限管理', 'ic:round-security'],
        'menus' => ['manage_menu', '/manage/menu', '菜单管理', 'material-symbols:route'],
    ];

    public static function install(): void
    {
        $parentId = DB::table('menus')->where('name', 'manage')->value('id');
        if (! $parentId) {
            $parentId = DB::table('menus')->insertGetId([
                'name' => 'manage', 'title' => '系统管理', 'path' => '/manage', 'component' => 'group',
                'icon' => 'carbon:cloud-service-management', 'sort' => 9, 'enabled' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        $order = 1;
        foreach (self::ITEMS as $resource => [$name, $path, $title, $icon]) {
            if (DB::table('menus')->where('name', $name)->exists()) {
                $order++;

                continue;
            }
            $legacy = DB::table('menus')->where('name', $resource)->where('component', $resource)->whereNull('parent_id')->first();
            $data = ['name' => $name, 'path' => $path, 'parent_id' => $parentId, 'icon' => $icon, 'sort' => $order++, 'updated_at' => now()];
            if ($legacy) {
                DB::table('menus')->where('id', $legacy->id)->update($data);
            } else {
                DB::table('menus')->insert([...$data, 'title' => $title, 'component' => $resource, 'permission' => $resource.'.read', 'enabled' => true, 'created_at' => now()]);
            }
        }
    }
}
