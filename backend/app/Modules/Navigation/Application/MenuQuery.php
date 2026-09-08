<?php

namespace App\Modules\Navigation\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use Illuminate\Support\Facades\DB;

final class MenuQuery
{
    public const VIEWS = ['home', 'profile', 'users', 'roles', 'permissions', 'menus'];

    /** @return array<string, mixed> */
    public function routes(User $user): array
    {
        $permissions = app(AccessQuery::class)->permissions($user);
        $menus = DB::table('menus')->where('enabled', true)->orderBy('sort')->orderBy('id')->get();
        $build = function (?int $parentId) use (&$build, $menus, $permissions): array {
            $routes = [];
            foreach ($menus as $menu) {
                if ($menu->parent_id !== $parentId || ($menu->permission && ! in_array($menu->permission, $permissions, true))) {
                    continue;
                }
                $children = $build($menu->id);
                if ($menu->component === 'group' && ! $children) {
                    continue;
                }
                $route = ['name' => $menu->name, 'path' => $menu->path, 'component' => $menu->component === 'group' ? 'layout.base' : ($parentId ? 'view.' : 'layout.base$view.').$menu->component, 'meta' => ['title' => $menu->title, 'icon' => $menu->icon, 'order' => $menu->sort]];
                if ($children) {
                    $route['children'] = $children;
                }
                $routes[] = $route;
            }

            return $routes;
        };
        // Personal pages remain available even when all management permissions are revoked.
        $fixed = array_map(fn ($name, $title) => ['name' => $name, 'path' => '/'.$name, 'component' => 'layout.base$view.'.$name, 'meta' => ['title' => $title, 'icon' => 'mdi:account-circle']], ['home', 'profile'], ['首页', '个人中心']);

        return ['routes' => [...$fixed, ...$build(null)], 'home' => 'home'];
    }
}
