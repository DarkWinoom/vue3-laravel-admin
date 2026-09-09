<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Access\Application\InitializeAdmin;
use App\Modules\Access\Domain\AccessAggregate;
use App\Modules\Access\Infrastructure\AccessProjector;
use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\RateLimiter;
use Illuminate\Cache\Repository;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\JWT;
use Spatie\EventSourcing\AggregateRoots\Exceptions\CouldNotPersistAggregate;
use Spatie\EventSourcing\Projectionist;
use Tests\Fixtures\FailingAccessProjector;
use Tests\TestCase;

final class IdentityAccessTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private string $token;

    private const PASSWORD = 'Stage-two-test-password!';

    protected function setUp(): void
    {
        parent::setUp();
        config(['jwt.secret' => str_repeat('test-secret-', 8), 'identity.origins' => ['http://localhost:9527'], 'cache.default' => 'array', 'cache.limiter' => 'array', 'logging.default' => 'null']);
        $loginLimiter = app(RateLimiter::class)->limiter('login');
        $limiter = new RateLimiter(new Repository(new ArrayStore));
        $limiter->for('login', $loginLimiter);
        $this->app->instance(RateLimiter::class, $limiter);
        $this->admin = app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', self::PASSWORD);
        $this->token = $this->login()['token'];
    }

    private function login(string $email = 'admin@example.test'): array
    {
        return $this->postJson('/api/v1/auth/login', ['email' => $email, 'password' => self::PASSWORD, 'client' => 'desktop'])->assertOk()->json('data');
    }

    private function version(): int
    {
        return app(AccessQuery::class)->version();
    }

    public function test_login_identity_validation_and_rate_limit(): void
    {
        $this->withToken($this->token)->getJson('/api/v1/auth/me')->assertOk()->assertJsonPath('data.roles.0', 'admin');
        $this->postJson('/api/v1/auth/login', ['email' => 'invalid'])->assertUnprocessable()->assertJsonPath('code', 'VALIDATION_FAILED');
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/auth/login', ['email' => 'missing@example.test', 'password' => 'wrong', 'client' => 'desktop'])->assertUnauthorized()->assertJsonPath('code', 'INVALID_CREDENTIALS');
        }
        $this->postJson('/api/v1/auth/login', ['email' => 'missing@example.test', 'password' => 'wrong', 'client' => 'desktop'])->assertStatus(429);
    }

    public function test_expired_forged_and_wrong_audience_tokens_are_rejected(): void
    {
        $this->withToken($this->token.'broken')->getJson('/api/v1/auth/me')->assertUnauthorized();
        $jwt = app(JWT::class);
        $bad = $jwt->claims(['iss' => config('identity.issuer'), 'aud' => 'another-api', 'sid' => 'none'])->fromSubject($this->admin);
        $this->withToken($bad)->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->travel(16)->minutes();
        $this->withToken($this->token)->getJson('/api/v1/auth/me')->assertUnauthorized()->assertJsonPath('code', 'TOKEN_EXPIRED');
    }

    public function test_refresh_rotation_reuse_revokes_the_session(): void
    {
        $first = $this->login();
        $second = $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', 'refreshToken' => $first['refreshToken']])->assertOk()->json('data');
        $this->assertNotSame($first['refreshToken'], $second['refreshToken']);
        $this->assertDatabaseMissing('refresh_credentials', ['hash' => $first['refreshToken']]);
        $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', 'refreshToken' => $first['refreshToken']])->assertUnauthorized();
        $this->withToken($second['token'])->getJson('/api/v1/auth/me')->assertUnauthorized()->assertJsonPath('code', 'SESSION_REVOKED');
        $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', 'refreshToken' => $second['refreshToken']])->assertUnauthorized();
    }

    public function test_web_cookie_csrf_origin_and_logout(): void
    {
        $web = $this->withHeader('Origin', 'http://localhost:9527')->postJson('/api/v1/auth/login', ['email' => $this->admin->email, 'password' => self::PASSWORD, 'client' => 'web'])->assertOk()->assertJsonMissingPath('data.refreshToken');
        $cookie = collect($web->headers->getCookies())->first(fn ($cookie) => $cookie->getName() === 'refresh_token');
        $this->assertTrue($cookie->isHttpOnly());
        $this->assertSame('strict', $cookie->getSameSite());
        $this->withCredentials()->withUnencryptedCookie('refresh_token', $cookie->getValue())->postJson('/api/v1/auth/refresh', ['client' => 'web'])->assertForbidden();
        $csrf = $web->json('data.csrfToken');
        $this->withHeader('X-CSRF-Token', $csrf)->postJson('/api/v1/auth/refresh', ['client' => 'web'])->assertOk();
        $this->withHeader('Origin', 'https://untrusted.example')->postJson('/api/v1/auth/refresh', ['client' => 'web'])->assertForbidden();
        $this->withHeader('Origin', 'http://localhost:9527')->withToken($web->json('data.token'))->postJson('/api/v1/auth/logout')->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
    }

    public function test_password_change_revokes_all_sessions_and_checks_current_password(): void
    {
        $data = ['name' => 'Updated', 'currentPassword' => 'wrong', 'password' => 'New-long-password!', 'password_confirmation' => 'New-long-password!'];
        $this->withToken($this->token)->putJson('/api/v1/auth/profile', $data)->assertUnprocessable();
        $this->putJson('/api/v1/auth/profile', [...$data, 'currentPassword' => self::PASSWORD])->assertOk();
        $this->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->assertSame(0, DB::table('refresh_sessions')->whereNull('revoked_at')->count());
    }

    public function test_crud_permissions_pagination_conflicts_and_last_admin_protection(): void
    {
        $this->withToken($this->token)->getJson('/api/v1/users?pageSize=101')->assertUnprocessable();
        $this->getJson('/api/v1/users?pageSize=1')->assertOk()->assertJsonPath('data.total', 1)->assertJsonMissingPath('data.records.0.password');
        $this->putJson('/api/v1/users/'.$this->admin->id, ['name' => 'Admin', 'email' => $this->admin->email, 'enabled' => false, 'version' => $this->version()])->assertStatus(409)->assertJsonPath('code', 'LAST_ADMIN');
        $this->deleteJson('/api/v1/users/'.$this->admin->id, ['version' => $this->version()])->assertStatus(409);
        $version = $this->version();
        $permission = $this->postJson('/api/v1/permissions', ['name' => 'reports.read', 'version' => $version])->assertOk()->json('data.id');
        $this->postJson('/api/v1/roles', ['name' => 'stale', 'permissionIds' => [], 'version' => $version])->assertStatus(409)->assertJsonPath('code', 'VERSION_CONFLICT');
        $role = $this->postJson('/api/v1/roles', ['name' => 'reader', 'permissionIds' => [$permission], 'version' => $this->version()])->assertOk()->json('data.id');
        $this->deleteJson('/api/v1/permissions/'.$permission, ['version' => $this->version()])->assertStatus(409);
        $user = $this->postJson('/api/v1/users', ['name' => 'Reader', 'email' => 'reader@example.test', 'password' => self::PASSWORD, 'enabled' => true, 'roleIds' => [$role], 'version' => $this->version()])->assertOk()->json('data.id');
        $this->deleteJson('/api/v1/roles/'.$role, ['version' => $this->version()])->assertStatus(409);
        $this->deleteJson('/api/v1/users/'.$user, ['version' => $this->version()])->assertOk();
        $this->deleteJson('/api/v1/roles/'.$role, ['version' => $this->version()])->assertOk();
        $this->deleteJson('/api/v1/permissions/'.$permission, ['version' => $this->version()])->assertOk();
    }

    public function test_cross_user_access_and_immediate_revocation(): void
    {
        $this->withToken($this->token);
        $read = (int) DB::table('permissions')->where('name', 'users.read')->value('id');
        $role = $this->postJson('/api/v1/roles', ['name' => 'viewer', 'permissionIds' => [$read], 'version' => $this->version()])->assertOk()->json('data.id');
        $user = $this->postJson('/api/v1/users', ['name' => 'Viewer', 'email' => 'viewer@example.test', 'password' => self::PASSWORD, 'enabled' => true, 'roleIds' => [$role], 'version' => $this->version()])->assertOk()->json('data.id');
        $viewer = $this->login('viewer@example.test');
        $this->withToken($viewer['token'])->getJson('/api/v1/users')->assertOk();
        $this->getJson('/api/v1/navigation/routes')->assertOk()->assertJsonCount(3, 'data.routes');
        $this->deleteJson('/api/v1/users/'.$this->admin->id, ['version' => $this->version()])->assertForbidden();
        $this->withToken($this->token)->putJson('/api/v1/roles/'.$role, ['name' => 'viewer', 'permissionIds' => [], 'version' => $this->version()])->assertOk();
        $this->withToken($viewer['token'])->getJson('/api/v1/users')->assertForbidden();
        $this->getJson('/api/v1/navigation/routes')->assertOk()->assertJsonCount(2, 'data.routes');
        $this->withToken($this->token)->putJson('/api/v1/users/'.$user, ['name' => 'Viewer', 'email' => 'viewer@example.test', 'enabled' => false, 'version' => $this->version()])->assertOk();
        $this->withToken($viewer['token'])->getJson('/api/v1/auth/me')->assertUnauthorized();
        $this->postJson('/api/v1/auth/login', ['email' => 'viewer@example.test', 'password' => self::PASSWORD, 'client' => 'desktop'])->assertUnauthorized();
    }

    public function test_replay_is_repeatable_and_transaction_failure_rolls_back_events_and_projections(): void
    {
        $before = app(AccessQuery::class)->identity($this->admin);
        $projectionist = app(Projectionist::class);
        for ($i = 0; $i < 2; $i++) {
            DB::transaction(fn () => $projectionist->replay(collect([app(AccessProjector::class)]), aggregateUuid: AccessAggregate::UUID));
            $this->assertSame($before, app(AccessQuery::class)->identity($this->admin));
        }
        $count = DB::table('stored_events')->count();
        try {
            DB::transaction(function () {
                app(AccessCommands::class)->record('permission.saved', ['id' => 900, 'name' => 'rollback.read']);
                throw new \RuntimeException('Injected transaction failure');
            });
        } catch (\RuntimeException) {
            $this->assertDatabaseCount('stored_events', $count);
            $this->assertDatabaseMissing('permissions', ['id' => 900]);
        }
    }

    public function test_stale_aggregate_cannot_overwrite_authorization(): void
    {
        $first = AccessAggregate::retrieve(AccessAggregate::UUID);
        $second = AccessAggregate::retrieve(AccessAggregate::UUID);
        $first->change('permission.saved', ['id' => 901, 'name' => 'first.read'], $this->admin->id, 'first')->persist();
        $this->expectException(CouldNotPersistAggregate::class);
        $second->change('permission.saved', ['id' => 902, 'name' => 'second.read'], $this->admin->id, 'second')->persist();
    }

    public function test_menu_crud_and_invalid_parent(): void
    {
        $this->withToken($this->token);
        $data = ['name' => 'team', 'title' => '团队', 'path' => '/team', 'component' => 'group', 'parent_id' => null, 'permission' => null, 'icon' => 'mdi:menu', 'sort' => 20, 'enabled' => true];
        $id = $this->postJson('/api/v1/menus', [...$data, 'version' => $this->version()])->assertOk()->json('data.id');
        $this->putJson('/api/v1/menus/'.$id, [...$data, 'parent_id' => $id, 'version' => $this->version()])->assertUnprocessable();
        $this->putJson('/api/v1/menus/'.$id, [...$data, 'title' => '新团队', 'version' => $this->version()])->assertOk();
        $this->getJson('/api/v1/menus?search='.rawurlencode('新团队'))->assertOk()->assertJsonPath('data.total', 1);
        $this->deleteJson('/api/v1/menus/'.$id, ['version' => $this->version()])->assertOk();
    }

    public function test_non_admin_cannot_escalate_through_roles_or_password_resets(): void
    {
        $this->withToken($this->token);
        $permissions = DB::table('permissions')->whereIn('name', ['users.read', 'users.update', 'roles.read', 'roles.update', 'roles.create'])->pluck('id')->all();
        $operatorRole = $this->postJson('/api/v1/roles', ['name' => 'operator', 'permissionIds' => $permissions, 'version' => $this->version()])->assertOk()->json('data.id');
        $highPermission = (int) DB::table('permissions')->where('name', 'menus.delete')->value('id');
        $highRole = $this->postJson('/api/v1/roles', ['name' => 'privileged', 'permissionIds' => [$highPermission], 'version' => $this->version()])->assertOk()->json('data.id');
        $operator = $this->postJson('/api/v1/users', ['name' => 'Operator', 'email' => 'operator@example.test', 'password' => self::PASSWORD, 'enabled' => true, 'roleIds' => [$operatorRole], 'version' => $this->version()])->assertOk()->json('data.id');
        $target = $this->postJson('/api/v1/users', ['name' => 'Privileged', 'email' => 'privileged@example.test', 'password' => self::PASSWORD, 'enabled' => true, 'roleIds' => [$highRole], 'version' => $this->version()])->assertOk()->json('data.id');
        $token = $this->login('operator@example.test')['token'];
        $this->withToken($token)->putJson('/api/v1/roles/'.$operatorRole, ['name' => 'operator', 'permissionIds' => [...$permissions, $highPermission], 'version' => $this->version()])->assertForbidden();
        $this->putJson('/api/v1/roles/'.$highRole, ['name' => 'privileged', 'permissionIds' => [], 'version' => $this->version()])->assertForbidden();
        $this->putJson('/api/v1/users/'.$target, ['name' => 'Privileged', 'email' => 'privileged@example.test', 'password' => 'Attacker-password!', 'enabled' => true, 'version' => $this->version()])->assertForbidden();
        $this->putJson('/api/v1/users/'.$operator, ['name' => 'Operator', 'email' => 'operator@example.test', 'enabled' => true, 'roleIds' => [1], 'version' => $this->version()])->assertForbidden();
    }

    public function test_projector_failure_rolls_back_the_event_and_read_tables(): void
    {
        app(Projectionist::class)->addProjector(FailingAccessProjector::class);
        $events = DB::table('stored_events')->count();
        $version = $this->version();
        $this->withToken($this->token)->postJson('/api/v1/permissions', ['name' => 'failure.read', 'version' => $version])->assertStatus(500);
        $this->assertDatabaseCount('stored_events', $events);
        $this->assertDatabaseMissing('permissions', ['name' => 'failure.read']);
        $this->assertSame($version, $this->version());
    }

    public function test_refresh_expiry_client_separation_and_logout(): void
    {
        $session = $this->login();
        $this->postJson('/api/v1/auth/refresh', ['client' => 'web', 'refreshToken' => $session['refreshToken']])->assertUnauthorized();
        $this->withToken($session['token'])->postJson('/api/v1/auth/logout')->assertOk();
        $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', 'refreshToken' => $session['refreshToken']])->assertUnauthorized();
        $other = $this->login();
        $this->travel(8)->days();
        $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', 'refreshToken' => $other['refreshToken']])->assertUnauthorized();
    }

    public function test_profile_changes_invalidate_stale_management_versions(): void
    {
        $version = $this->version();
        $this->withToken($this->token)->putJson('/api/v1/auth/profile', ['name' => 'Updated profile'])->assertOk();
        $this->putJson('/api/v1/users/'.$this->admin->id, ['name' => 'Stale name', 'email' => $this->admin->email, 'enabled' => true, 'version' => $version])->assertStatus(409);
        $this->assertSame('Updated profile', $this->admin->fresh()->name);
    }

    public function test_numeric_string_role_ids_do_not_bypass_admin_assignment_protection(): void
    {
        DB::transaction(function () {
            $commands = app(AccessCommands::class);
            $commands->lock();
            $role = $commands->save('roles', ['name' => 'all_permissions', 'permissionIds' => DB::table('permissions')->pluck('id')->all()], null, $this->admin);
            $manager = User::create(['name' => 'Manager', 'email' => 'manager@example.test', 'password' => self::PASSWORD]);
            $commands->assign($manager, [$role], $this->admin);
        });
        $target = User::factory()->create();
        $token = $this->login('manager@example.test')['token'];
        $adminRole = (string) DB::table('roles')->where('name', 'admin')->value('id');
        $this->withToken($token)->putJson('/api/v1/users/'.$target->id, ['name' => $target->name, 'email' => $target->email, 'enabled' => true, 'roleIds' => [$adminRole], 'version' => $this->version()])->assertForbidden();
        $this->assertSame([], app(AccessQuery::class)->roles($target));
    }
}
