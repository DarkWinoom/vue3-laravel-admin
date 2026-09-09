<?php

namespace Tests\Feature;

use App\Modules\Access\Application\InitializeAdmin;
use App\Shared\ApiException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class InitializationTest extends TestCase
{
    use RefreshDatabase;

    public function test_interactive_initializer_creates_the_admin_and_cannot_run_twice(): void
    {
        $this->artisan('admin:create', ['email' => 'first@example.test'])
            ->expectsQuestion('Password (at least 12 characters)', 'First-admin-test-password!')
            ->expectsOutput('Administrator initialized.')
            ->assertSuccessful();
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('roles', 1);
        $this->assertDatabaseCount('permissions', 16);
        $this->assertDatabaseCount('menus', 4);
        $this->expectException(ApiException::class);
        app(InitializeAdmin::class)->handle('second@example.test', 'Second', 'Second-admin-test-password!');
    }
}
