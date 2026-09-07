<?php

namespace Tests\Fixtures;

use Spatie\EventSourcing\EventHandlers\Projectors\Projector;

final class BaselineProjector extends Projector
{
    public array $values = [];

    public function onBaselineEvent(BaselineEvent $event): void
    {
        $this->values[] = $event->value;
    }

    public function resetState(): void
    {
        $this->values = [];
    }
}
