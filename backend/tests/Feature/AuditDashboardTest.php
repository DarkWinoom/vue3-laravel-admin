<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Access\Application\InitializeAdmin;
use App\Modules\Access\Infrastructure\AccessProjector;
use App\Modules\Audit\Application\AuditRecorder;
use App\Modules\Identity\Application\SessionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\EventSourcing\Projectionist;
use Tests\TestCase;

final class AuditDashboardTest extends TestCase
{
    use RefreshDatabase;

    private string $token;

    protected function setUp(): void
    {
        parent::setUp();
        config(['jwt.secret' => str_repeat('test-secret-', 8), 'cache.default' => 'array', 'cache.limiter' => 'array', 'logging.default' => 'null']);
        app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', 'Stage-three-password!');
        $this->token = app(SessionService::class)->login('admin@example.test', 'Stage-three-password!', 'desktop')['token'];
    }

    public function test_audit_is_atomic_redacted_and_not_recreated_on_replay(): void
    {
        $before = DB::table('audit_logs')->count();
        DB::beginTransaction();
        app(AccessCommands::class)->record('permission.saved', ['id' => 100, 'name' => 'temporary.read', 'password' => 'never-store']);
        $this->assertDatabaseCount('audit_logs', $before + 1);
        DB::rollBack();
        $this->assertDatabaseCount('audit_logs', $before);
        $this->assertDatabaseMissing('permissions', ['id' => 100]);
        app(AuditRecorder::class)->record('redaction.test', details: ['email' => 'private@example.test', 'password' => 'secret', 'token' => 'secret', 'csrfToken' => 'secret', 'refreshToken' => 'secret', 'name' => 'Public name', 'passwordChanged' => true]);
        $details = json_decode(DB::table('audit_logs')->orderByDesc('id')->value('details'), true);
        $this->assertSame(['name' => 'Public name', 'passwordChanged' => true], $details);
        app(Projectionist::class)->replay(collect([app(AccessProjector::class)]));
        $this->assertDatabaseCount('audit_logs', $before + 1);
    }

    public function test_failed_writes_are_recorded_and_audit_filters_are_enforced(): void
    {
        $this->withToken($this->token)->postJson('/api/v1/users', ['password' => 'never-store'])->assertUnprocessable();
        $page = $this->getJson('/api/v1/audit-logs?result=failure&action=POST')->assertOk()->json('data');
        $this->assertSame(1, $page['total']);
        $this->assertSame('VALIDATION_FAILED', $page['records'][0]['error_code']);
        $this->assertSame([], $page['records'][0]['details']);
        $this->assertStringNotContainsString('never-store', json_encode($page));
        $this->getJson('/api/v1/audit-logs?dateFrom=2099-01-01&dateTo=2099-01-02')->assertJsonPath('data.total', 0);
        $this->getJson('/api/v1/audit-logs?dateTo=2000-01-01')->assertOk()->assertJsonPath('data.total', 0);
        $this->getJson('/api/v1/audit-logs?dateFrom=2099-01-02&dateTo=2099-01-01')->assertUnprocessable();
        $this->getJson('/api/v1/audit-logs?pageSize=101')->assertUnprocessable();
    }

    public function test_dashboard_exposes_only_authorized_real_data_and_audit_is_read_only(): void
    {
        $page = $this->withToken($this->token)->getJson('/api/v1/dashboard')->assertOk()->json('data');
        $this->assertSame(DB::table('users')->count(), $page['metrics'][0]['value']);
        $this->assertTrue($page['canAudit']);
        $this->assertCount(7, $page['trend']);
        $this->assertNotEmpty($page['recent']);
        $viewer = User::factory()->create(['email' => 'viewer@example.test', 'password' => 'Viewer-password!']);
        $token = app(SessionService::class)->login($viewer->email, 'Viewer-password!', 'desktop')['token'];
        $this->withToken($token)->getJson('/api/v1/dashboard')->assertOk()->assertJsonPath('data.metrics', [])->assertJsonPath('data.canAudit', false)->assertJsonPath('data.recent', []);
        $this->getJson('/api/v1/audit-logs')->assertForbidden();
        $this->postJson('/api/v1/audit-logs', [])->assertStatus(405);
        $permission = DB::table('permissions')->where('name', 'users.read')->value('id');
        DB::transaction(function () use ($permission, $viewer) {
            app(AccessCommands::class)->record('role.saved', ['id' => 2, 'name' => 'viewer', 'permissionIds' => [$permission]]);
            app(AccessCommands::class)->assign($viewer, [2], null);
        });
        $this->assertSame(['users.read'], app(AccessQuery::class)->permissions($viewer));
        $this->getJson('/api/v1/dashboard')->assertJsonCount(1, 'data.metrics')->assertJsonPath('data.metrics.0.value', 2);
    }
}
