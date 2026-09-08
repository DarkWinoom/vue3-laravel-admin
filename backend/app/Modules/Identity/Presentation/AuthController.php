<?php

namespace App\Modules\Identity\Presentation;

use App\Models\User;
use App\Modules\Access\Application\AccessQuery;
use App\Modules\Identity\Application\SessionService;
use App\Shared\Api;
use App\Shared\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

final class AuthController
{
    public function login(LoginRequest $request, SessionService $sessions): JsonResponse
    {
        $client = $request->string('client')->toString();

        return $this->tokens($sessions->login($request->string('email')->toString(), $request->string('password')->toString(), $client), $client);
    }

    public function refresh(Request $request, SessionService $sessions): JsonResponse
    {
        $request->validate(['client' => 'required|in:web,desktop', 'refreshToken' => 'nullable|string|max:100']);
        $client = $request->string('client')->toString();
        $credential = $client === 'web' ? $request->cookie('refresh_token', '') : $request->input('refreshToken', '');

        return $this->tokens($sessions->refresh($credential, $client, $request->header('X-CSRF-Token', '')), $client);
    }

    /** @param array<string, mixed> $tokens */
    private function tokens(array $tokens, string $client): JsonResponse
    {
        $refresh = $tokens['refreshToken'];
        if ($client === 'web') {
            unset($tokens['refreshToken']);
        }
        $response = Api::ok($tokens)->header('Cache-Control', 'no-store');
        if ($client === 'web') {
            $response->cookie('refresh_token', $refresh, config('identity.refresh_minutes'), '/', null, config('identity.secure_cookie'), true, false, 'strict');
            $response->cookie('csrf_token', $tokens['csrfToken'], config('identity.refresh_minutes'), '/', null, config('identity.secure_cookie'), false, false, 'strict');
        }

        return $response;
    }

    public function me(Request $request, AccessQuery $access): JsonResponse
    {
        return Api::ok($access->identity($request->user()));
    }

    public function logout(Request $request): JsonResponse
    {
        $session = $request->attributes->get('session');
        if ($session->client === 'web' && ! hash_equals($session->csrf_hash, hash('sha256', $request->header('X-CSRF-Token', '')))) {
            throw new ApiException(403, 'CSRF_INVALID', '请求校验失败');
        }
        DB::table('refresh_sessions')->where('id', $session->id)->update(['revoked_at' => now()]);

        return Api::ok()->withoutCookie('refresh_token')->withoutCookie('csrf_token');
    }

    public function profile(Request $request, SessionService $sessions, AccessQuery $access): JsonResponse
    {
        $data = $request->validate(['name' => 'required|string|max:100', 'currentPassword' => 'required_with:password|string', 'password' => 'nullable|string|min:12|max:128|confirmed']);
        $user = DB::transaction(function () use ($request, $data, $sessions) {
            $user = User::whereKey($request->user()->id)->lockForUpdate()->firstOrFail();
            if (! empty($data['password'])) {
                if (! Hash::check($data['currentPassword'], $user->password)) {
                    throw new ApiException(422, 'PASSWORD_MISMATCH', '当前密码错误');
                }
                $user->password = $data['password'];
                $sessions->revokeUser($user->id);
            }
            $user->name = $data['name'];
            $user->save();

            return $user;
        });

        return Api::ok($access->identity($user));
    }
}
