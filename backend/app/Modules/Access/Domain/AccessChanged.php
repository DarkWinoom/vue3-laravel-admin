<?php

namespace App\Modules\Access\Domain;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

final class AccessChanged extends ShouldBeStored
{
    /** @param array<string, mixed> $data */
    public function __construct(public string $action, public array $data, public ?int $actorId, public string $requestId) {}
}
