<?php

namespace Tests\Feature;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Access\Application\InitializeAdmin;
use App\Modules\Identity\Application\SessionService;
use Dedoc\Scramble\Generator;
use Dedoc\Scramble\Scramble;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Symfony\Component\Process\Process;
use Tests\TestCase;

final class DocumentationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['jwt.secret' => str_repeat('test-secret-', 8), 'cache.default' => 'array', 'cache.limiter' => 'array', 'logging.default' => 'null', 'documentation.enabled' => true]);
        app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', 'Stage-three-password!');
    }

    public function test_documentation_requires_permission_and_can_be_disabled(): void
    {
        $this->getJson('/api/v1/openapi')->assertUnauthorized();
        $user = User::factory()->create(['password' => 'Viewer-password!']);
        $viewer = app(SessionService::class)->login($user->email, 'Viewer-password!', 'desktop');
        $this->withToken($viewer['token'])->getJson('/api/v1/openapi')->assertForbidden();
        $admin = app(SessionService::class)->login('admin@example.test', 'Stage-three-password!', 'desktop');
        $this->withToken($admin['token'])->getJson('/api/v1/openapi')->assertOk()->assertJsonPath('data.components.securitySchemes.bearerAuth.scheme', 'bearer');
        config(['documentation.enabled' => false]);
        $this->getJson('/api/v1/openapi')->assertNotFound();
        $routes = $this->getJson('/api/v1/navigation/routes')->assertOk()->json('data.routes');
        $this->assertNotContains('manage_docs', array_column($routes[2]['children'], 'name'));
        $this->get('/docs/api')->assertNotFound();
        $this->get('/docs/api.json')->assertNotFound();
    }

    public function test_generated_contract_matches_real_success_and_error_responses(): void
    {
        $cases = [];
        $capture = function (string $method, string $path, array $body = [], int $status = 200, ?string $contractPath = null) use (&$cases) {
            $response = $this->json(strtoupper($method), '/api'.$path, $body)->assertStatus($status);
            $cases[] = ['path' => $contractPath ?? $path, 'method' => $method, 'status' => (string) $status, 'body' => json_decode($response->getContent())];

            return $response;
        };
        $capture('get', '/v1/health');
        $capture('get', '/v1/auth/me', [], 401);
        $login = $capture('post', '/v1/auth/login', ['email' => 'admin@example.test', 'password' => 'Stage-three-password!', 'client' => 'desktop'])->json('data');
        $this->withToken($login['token']);
        foreach (['auth/me', 'users', 'roles', 'permissions', 'menus', 'navigation/routes', 'dashboard', 'audit-logs'] as $path) {
            $capture('get', '/v1/'.$path);
        }
        $capture('post', '/v1/users', [], 422);
        $version = fn () => app(AccessQuery::class)->version();
        $user = $capture('post', '/v1/users', ['name' => 'Contract user', 'email' => 'contract@example.test', 'password' => 'Contract-password!', 'enabled' => true, 'version' => $version()])->json('data.id');
        $capture('put', '/v1/users/'.$user, ['name' => 'Updated', 'email' => 'contract@example.test', 'enabled' => true, 'version' => $version()], 200, '/v1/users/{id}');
        $capture('delete', '/v1/users/'.$user, ['version' => $version()], 200, '/v1/users/{id}');
        $capture('delete', '/v1/users/'.$user, ['version' => 0], 409, '/v1/users/{id}');
        $capture('get', '/v1/users');
        $capture('get', '/v1/audit-logs');
        $capture('put', '/v1/auth/profile', ['name' => 'Admin updated']);
        $capture('post', '/v1/auth/logout');
        $spec = app(Generator::class)->generate(Scramble::configure())->spec();
        $this->assertArrayNotHasKey('/v1/{resource}', $spec['paths']);
        $this->assertArrayHasKey('/v1/roles', $spec['paths']);
        $temporary = storage_path('framework/contract-test-'.Str::uuid().'.json');
        try {
            file_put_contents($temporary, json_encode(['spec' => $spec, 'cases' => $cases], JSON_THROW_ON_ERROR));
            $process = new Process(['node', base_path('../scripts/validate-api-contract.mjs'), $temporary], base_path('..'));
            $process->run();
            $this->assertTrue($process->isSuccessful(), $process->getErrorOutput().$process->getOutput());
        } finally {
            @unlink($temporary);
        }
    }
}
