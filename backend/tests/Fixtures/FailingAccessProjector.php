<?php

namespace Tests\Fixtures;

use App\Modules\Access\Domain\AccessChanged;
use Spatie\EventSourcing\EventHandlers\Projectors\Projector;

final class FailingAccessProjector extends Projector
{
    public function onAccessChanged(AccessChanged $event): void
    {
        if (($event->data['name'] ?? '') === 'failure.read') {
            throw new \RuntimeException('Injected projection failure');
        }
    }
}
