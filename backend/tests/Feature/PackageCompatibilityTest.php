<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\JWT;
use Spatie\EventSourcing\Projectionist;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\Fixtures\BaselineAggregate;
use Tests\Fixtures\BaselineEvent;
use Tests\Fixtures\BaselineProjector;
use Tests\Fixtures\PackageUser;
use Tests\TestCase;

final class PackageCompatibilityTest extends TestCase
{
    use RefreshDatabase;

    public function test_jwt_can_be_signed_and_verified(): void
    {
        config(['jwt.secret' => str_repeat('stage-one-test-', 8)]);
        $user = new PackageUser(['name' => 'Compatibility', 'email' => 'compatibility@example.test', 'password' => 'testing']);
        $user->save();
        $jwt = app(JWT::class);
        $token = $jwt->fromSubject($user);

        $this->assertSame((string) $user->getKey(), (string) $jwt->setToken($token)->getPayload()->get('sub'));
        $this->assertFalse($jwt->setToken($token.'corrupted')->check());
    }

    public function test_permission_grants_and_revocation_work(): void
    {
        $user = new PackageUser(['name' => 'Compatibility', 'email' => 'compatibility@example.test', 'password' => 'testing']);
        $user->save();
        $permission = Permission::create(['name' => 'baseline.read', 'guard_name' => 'web']);
        $role = Role::create(['name' => 'baseline', 'guard_name' => 'web']);
        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $this->assertTrue($user->hasPermissionTo('baseline.read'));
        $role->revokePermissionTo($permission);
        $this->assertFalse($user->fresh()->hasPermissionTo('baseline.read'));
    }

    public function test_stored_events_replay_and_transaction_rollback(): void
    {
        $projector = new BaselineProjector;
        $this->app->instance(BaselineProjector::class, $projector);
        $projectionist = app(Projectionist::class)->addProjector($projector);
        $uuid = (string) Str::uuid();
        DB::transaction(fn () => BaselineAggregate::retrieve($uuid)->recordThat(new BaselineEvent('first'))->persist());

        $this->assertSame(['first'], $projector->values);
        $this->assertDatabaseCount('stored_events', 1);
        $projectionist->replay(collect([$projector]), aggregateUuid: $uuid);
        $this->assertSame(['first'], $projector->values);

        DB::beginTransaction();
        BaselineAggregate::retrieve($uuid)->recordThat(new BaselineEvent('rolled-back'))->persist();
        DB::rollBack();
        $this->assertDatabaseCount('stored_events', 1);
        $projectionist->replay(collect([$projector]), aggregateUuid: $uuid);
        $this->assertSame(['first'], $projector->values);
    }
}
