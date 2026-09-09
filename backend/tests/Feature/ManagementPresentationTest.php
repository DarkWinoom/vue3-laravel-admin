<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Access\Application\InitializeAdmin;
use App\Modules\Identity\Application\UserQuery;
use App\Modules\Navigation\Application\DefaultMenus;
use App\Modules\Navigation\Application\MenuQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class ManagementPresentationTest extends TestCase
{
    use RefreshDatabase;

    public function test_management_routes_match_the_official_two_level_structure(): void
    {
        $admin = app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', 'Test-password-long!');
        $routes = app(MenuQuery::class)->routes($admin)['routes'];
        $this->assertSame('mdi:monitor-dashboard', $routes[0]['meta']['icon']);
        $this->assertTrue($routes[1]['meta']['hideInMenu']);
        $this->assertSame('manage', $routes[2]['name']);
        $this->assertSame('carbon:cloud-service-management', $routes[2]['meta']['icon']);
        $this->assertSame(['manage_user', 'manage_role', 'manage_permission', 'manage_menu', 'manage_audit', 'manage_docs'], array_column($routes[2]['children'], 'name'));
        $this->assertSame('view.manage_user', $routes[2]['children'][0]['component']);
        $this->assertSame('ic:round-manage-accounts', $routes[2]['children'][0]['meta']['icon']);
        $this->assertSame('/manage/user', $routes[2]['children'][0]['path']);
        $viewer = User::factory()->create();
        $this->assertCount(2, app(MenuQuery::class)->routes($viewer)['routes']);
    }

    public function test_existing_default_menu_is_migrated_without_losing_custom_labels_or_permissions(): void
    {
        $id = DB::table('menus')->insertGetId(['name' => 'users', 'title' => '用户目录', 'path' => '/users', 'component' => 'users', 'permission' => 'users.read', 'enabled' => false]);
        $migration = require database_path('migrations/2026_09_09_000001_group_default_management_menus.php');
        $migration->up();
        $row = DB::table('menus')->where('id', $id)->first();
        $this->assertSame('manage_user', $row->name);
        $this->assertSame('/manage/user', $row->path);
        $this->assertSame('用户目录', $row->title);
        $this->assertSame('users.read', $row->permission);
        $this->assertFalse((bool) $row->enabled);
        $this->assertNotNull($row->parent_id);
        DefaultMenus::install();
        $this->assertDatabaseCount('menus', 7);
    }

    public function test_user_search_supports_the_official_name_email_and_status_fields(): void
    {
        User::factory()->create(['name' => 'Alice', 'email' => 'alice@example.test', 'enabled' => true]);
        User::factory()->create(['name' => 'Alice Disabled', 'email' => 'disabled@example.test', 'enabled' => false]);
        $query = app(UserQuery::class);
        $this->assertSame(1, $query->page(['name' => 'Alice', 'enabled' => 0])['total']);
        $this->assertSame(1, $query->page(['email' => 'alice@', 'enabled' => 1])['total']);
        $this->assertSame(0, $query->page(['name' => 'Bob'])['total']);
    }

    public function test_menu_table_keeps_children_with_their_paginated_parent(): void
    {
        app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', 'Test-password-long!');
        $page = app(MenuQuery::class)->page(['pageSize' => 1]);
        $this->assertSame(1, $page['total']);
        $this->assertSame('manage', $page['records'][0]->name);
        $this->assertCount(6, $page['records'][0]->children);
        $filtered = app(MenuQuery::class)->page(['search' => '用户']);
        $this->assertCount(1, $filtered['records'][0]->children);
        $this->assertSame('manage_user', $filtered['records'][0]->children[0]->name);
    }
}
