<?php

namespace App\Modules\Documentation\Application;

use Dedoc\Scramble\Support\Generator\Types\Type;

/** Explicit schemas for application results whose types are lost across transaction closures. */
final class ContractSchema extends Type
{
    /** @param array<string, mixed> $definition */
    public function __construct(private array $definition)
    {
        parent::__construct('object');
    }

    /** @return array<string, mixed> */
    public function toArray(): array
    {
        return $this->definition;
    }
}
