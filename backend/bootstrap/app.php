<?php

use App\Modules\Audit\Application\AuditRecorder;
use App\Shared\ApiException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Routing\Route;
use Illuminate\Validation\ValidationException;
use Spatie\EventSourcing\AggregateRoots\Exceptions\CouldNotPersistAggregate;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->dontReport([ApiException::class]);
        $exceptions->shouldRenderJsonWhen(fn (Request $request) => $request->is('api/*'));
        $exceptions->render(function (Throwable $error, Request $request) {
            if (! $request->is('api/*')) {
                return null;
            }
            $status = $error instanceof ApiException ? $error->status : ($error instanceof ValidationException ? 422 : ($error instanceof HttpExceptionInterface ? $error->getStatusCode() : 500));
            $code = $error instanceof ApiException ? $error->errorCode : match ($status) {
                422 => 'VALIDATION_FAILED', 403 => 'FORBIDDEN', 404 => 'NOT_FOUND', 429 => 'RATE_LIMITED', default => 'REQUEST_FAILED'
            };
            if ($error instanceof CouldNotPersistAggregate) {
                $status = 409;
                $code = 'VERSION_CONFLICT';
            }

            // Application transactions have rolled back before failures are recorded.
            $route = $request->route();
            app(AuditRecorder::class)->record(
                $request->method().' '.($route instanceof Route ? $route->uri() : 'unmatched'),
                $request->user(), null, [], $status, $code,
            );

            return response()->json(['code' => $code, 'msg' => $status === 500 ? '服务暂时不可用' : $error->getMessage(), 'data' => null, 'errors' => $error instanceof ValidationException ? $error->errors() : null], $status);
        });
    })->create();

if (is_file(dirname(__DIR__, 2).'/.env')) {
    $app->useEnvironmentPath(dirname(__DIR__, 2));
}

return $app;
