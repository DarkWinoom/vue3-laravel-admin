<?php

namespace Tests\Fixtures;

use App\Models\User;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Spatie\Permission\Traits\HasRoles;

final class PackageUser extends User implements JWTSubject
{
    use HasRoles;

    protected $table = 'users';

    protected $guard_name = 'web';

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }
}
