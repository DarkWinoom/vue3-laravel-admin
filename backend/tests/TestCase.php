<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $app = parent::createApplication();
        $connection = config('database.default');
        $database = config("database.connections.{$connection}.database");

        if (! $app->environment('testing') || ! ($database === ':memory:' || (is_string($database) && str_ends_with($database, '_testing')))) {
            throw new RuntimeException('Tests require an in-memory database or a dedicated database ending in _testing.');
        }

        return $app;
    }
}
