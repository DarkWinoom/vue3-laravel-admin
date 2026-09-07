<?php

namespace Tests\Fixtures;

use Spatie\EventSourcing\StoredEvents\ShouldBeStored;

final class BaselineEvent extends ShouldBeStored
{
    public function __construct(public string $value) {}
}
