<?php

namespace App\Modules\Identity\Presentation;

use App\Models\User;
use App\Shared\ApiException;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\JWT;
use Symfony\Component\HttpFoundation\Response;

final class AuthenticateSession
{
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $payload = app(JWT::class)->setToken($request->bearerToken() ?? '')->getPayload();
        } catch (TokenExpiredException) {
            throw new ApiException(401, 'TOKEN_EXPIRED', '登录凭据已过期');
        } catch (JWTException) {
            throw new ApiException(401, 'UNAUTHENTICATED', '请先登录');
        }
        if ($payload->get('iss') !== config('identity.issuer') || (array) $payload->get('aud') !== [config('identity.audience')]) {
            throw new ApiException(401, 'UNAUTHENTICATED', '登录凭据无效');
        }
        $user = User::find($payload->get('sub'));
        $session = DB::table('refresh_sessions')->where('id', $payload->get('sid'))->where('user_id', $payload->get('sub'))->first();
        if (! $user || ! $user->enabled || ! $session || $session->revoked_at || now()->gte($session->expires_at)) {
            throw new ApiException(401, 'SESSION_REVOKED', '会话已失效，请重新登录');
        }
        $request->setUserResolver(fn () => $user);
        $request->attributes->set('session', $session);

        return $next($request);
    }
}
