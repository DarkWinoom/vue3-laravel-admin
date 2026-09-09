<?php

namespace App\Modules\Navigation\Application;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use Illuminate\Support\Facades\DB;

final class MenuQuery
{
    public const VIEWS = ['users' => 'manage_user', 'roles' => 'manage_role', 'permissions' => 'manage_permission', 'menus' => 'manage_menu'];

    /** @param array<string, mixed> $filters
     * @return array<string, mixed>
     */
    public function page(array $filters): array
    {
        $search = $filters['search'] ?? null;
        $page = DB::table('menus')->whereNull('parent_id')
            ->when($search, fn ($query) => $query->where(fn ($query) => $query->where('title', 'like', "%$search%")
                ->orWhereIn('id', DB::table('menus')->select('parent_id')->whereNotNull('parent_id')->where('title', 'like', "%$search%"))))
            ->orderBy('sort')->orderBy('id')->paginate($filters['pageSize'] ?? 20, ['*'], 'page', $filters['page'] ?? 1);
        $children = DB::table('menus')->whereIn('parent_id', $page->pluck('id'))->orderBy('sort')->orderBy('id')->get()->groupBy('parent_id');
        $records = $page->items();
        foreach ($records as $menu) {
            if ($menu->component === 'group') {
                $items = $children->get($menu->id, collect());
                if ($search && mb_stripos($menu->title, $search) === false) {
                    $items = $items->filter(fn ($child) => mb_stripos($child->title, $search) !== false);
                }
                $menu->children = $items->values()->all();
            }
        }

        return ['records' => $records, 'total' => $page->total(), 'page' => $page->currentPage(), 'pageSize' => $page->perPage(), 'version' => app(AccessQuery::class)->version()];
    }

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
                $view = self::VIEWS[$menu->component] ?? $menu->component;
                $route = ['name' => $menu->name, 'path' => $menu->path, 'component' => $menu->component === 'group' ? 'layout.base' : ($parentId ? 'view.' : 'layout.base$view.').$view, 'meta' => ['title' => $menu->title, 'icon' => $menu->icon, 'order' => $menu->sort]];
                if ($children) {
                    $route['children'] = $children;
                }
                $routes[] = $route;
            }

            return $routes;
        };
        // Personal pages remain available even when all management permissions are revoked.
        $fixed = [
            ['name' => 'home', 'path' => '/home', 'component' => 'layout.base$view.home', 'meta' => ['title' => '首页', 'icon' => 'mdi:monitor-dashboard', 'order' => 1]],
            ['name' => 'profile', 'path' => '/profile', 'component' => 'layout.base$view.profile', 'meta' => ['title' => '个人中心', 'icon' => 'ph:user-circle', 'hideInMenu' => true]],
        ];

        return ['routes' => [...$fixed, ...$build(null)], 'home' => 'home'];
    }
}
