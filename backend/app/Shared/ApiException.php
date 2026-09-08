<?php

namespace App\Shared;

use RuntimeException;

final class ApiException extends RuntimeException
{
    public function __construct(public readonly int $status, public readonly string $errorCode, string $message)
    {
        parent::__construct($message);
    }
}
