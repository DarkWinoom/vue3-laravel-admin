<?php

namespace Tests\Feature;

use Tests\TestCase;

final class HealthTest extends TestCase
{
    public function test_health_endpoint_is_available(): void
    {
        $this->getJson('/api/v1/health')->assertOk()->assertExactJson(['status' => 'ok']);
    }

    public function test_openapi_export_includes_health_endpoint(): void
    {
        $path = storage_path('framework/testing-openapi.json');

        try {
            $this->artisan('scramble:export', ['--path' => $path])->assertSuccessful();
            $document = json_decode(file_get_contents($path), true, flags: JSON_THROW_ON_ERROR);
            $this->assertArrayHasKey('/v1/health', $document['paths']);
        } finally {
            if (file_exists($path)) {
                unlink($path);
            }
        }
    }
}
