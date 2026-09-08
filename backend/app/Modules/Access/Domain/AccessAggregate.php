<?php

namespace App\Modules\Access\Domain;

use Spatie\EventSourcing\AggregateRoots\AggregateRoot;

final class AccessAggregate extends AggregateRoot
{
    public const UUID = '49024b50-b7d5-4d3b-a87e-aaeb3689d601';

    /** @param array<string, mixed> $data */
    public function change(string $action, array $data, ?int $actorId, string $requestId): self
    {
        $this->recordThat(new AccessChanged($action, $data, $actorId, $requestId));

        return $this;
    }
}
