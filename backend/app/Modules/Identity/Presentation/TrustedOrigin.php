<?php

namespace App\Modules\Identity\Presentation;

use App\Shared\ApiException;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

final class TrustedOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        $origin = $request->header('Origin');
        if (($origin && ! in_array($origin, config('identity.origins'), true)) || (! $origin && $request->header('Sec-Fetch-Site') === 'cross-site')) {
            throw new ApiException(403, 'ORIGIN_DENIED', '请求来源不受信任');
        }

        return $next($request);
    }
}
