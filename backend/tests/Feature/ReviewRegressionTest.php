<?php

namespace Tests\Feature;

use App\Modules\Access\Application\AccessCommands;
use App\Modules\Access\Application\InitializeAdmin;
use App\Modules\Access\Infrastructure\AccessProjector;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Spatie\EventSourcing\Projectionist;
use Tests\TestCase;

final class ReviewRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_invalid_desktop_refresh_payloads_are_validation_errors_not_server_errors(): void
    {
        foreach ([[], ['refreshToken' => null], ['refreshToken' => ''], ['refreshToken' => ['invalid']]] as $payload) {
            $this->postJson('/api/v1/auth/refresh', ['client' => 'desktop', ...$payload])->assertUnprocessable()->assertJsonPath('code', 'VALIDATION_FAILED');
        }
        $this->postJson('/api/v1/auth/refresh', ['client' => 'web'])->assertUnauthorized()->assertJsonPath('code', 'SESSION_REVOKED');
    }

    public function test_authorization_updates_and_replay_preserve_original_creation_times(): void
    {
        $this->freezeTime();
        app(InitializeAdmin::class)->handle('admin@example.test', 'Admin', 'Review-password-long!');
        $save = function (string $name) {
            DB::transaction(function () use ($name) {
                $commands = app(AccessCommands::class);
                $commands->lock();
                $commands->record('permission.saved', ['id' => 100, 'name' => $name.'.read']);
                $this->travel(1)->seconds();
                $commands->record('role.saved', ['id' => 100, 'name' => $name, 'permissionIds' => [100]]);
            });
        };
        $save('original');
        $created = [];
        foreach (['roles', 'permissions'] as $table) {
            $created[$table] = DB::table($table)->where('id', 100)->value('created_at');
        }
        $this->travel(1)->hours();
        $save('updated');
        foreach (['roles', 'permissions'] as $table) {
            $row = DB::table($table)->where('id', 100)->first();
            $this->assertSame($created[$table], $row->created_at);
            $this->assertNotSame($created[$table], $row->updated_at);
        }
        app(Projectionist::class)->replay(collect([app(AccessProjector::class)]));
        foreach (['roles', 'permissions'] as $table) {
            $this->assertSame($created[$table], DB::table($table)->where('id', 100)->value('created_at'));
        }
    }
}
