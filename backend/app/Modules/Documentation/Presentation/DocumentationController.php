<?php

namespace App\Modules\Documentation\Presentation;

use App\Modules\Access\Application\AccessCommands;
use App\Shared\Api;
use Dedoc\Scramble\Attributes\ExcludeAllRoutesFromDocs;
use Dedoc\Scramble\Generator;
use Dedoc\Scramble\Scramble;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

#[ExcludeAllRoutesFromDocs]
final class DocumentationController
{
    public function __invoke(Request $request, AccessCommands $access, Generator $generator): JsonResponse
    {
        abort_unless(config('documentation.enabled'), 404);
        $access->authorize($request->user(), 'docs.read');

        return Api::ok($generator->generate(Scramble::configure())->spec())->header('Cache-Control', 'no-store');
    }
}
