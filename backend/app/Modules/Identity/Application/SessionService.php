<?php

namespace App\Modules\Identity\Application;

use App\Models\User;
use App\Shared\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PHPOpenSourceSaver\JWTAuth\JWT;

final class SessionService
{
    /** @return array<string, mixed> */
    public function login(string $email, string $password, string $client): array
    {
        return DB::transaction(function () use ($email, $password, $client) {
            $user = User::where('email', $email)->lockForUpdate()->first();
            if (! $user || ! Hash::check($password, $user->password) || ! $user->enabled) {
                throw new ApiException(401, 'INVALID_CREDENTIALS', '邮箱或密码错误');
            }
            $id = (string) Str::uuid();
            $csrf = Str::random(64);
            DB::table('refresh_sessions')->insert([
                'id' => $id, 'user_id' => $user->id, 'client' => $client,
                'csrf_hash' => hash('sha256', $csrf),
                'expires_at' => now()->addMinutes(config('identity.refresh_minutes')),
                'created_at' => now(), 'updated_at' => now(),
            ]);

            return $this->issue($user, $id, $csrf);
        });
    }

    /** @return array<string, mixed> */
    public function refresh(string $credential, string $client, string $csrf): array
    {
        // Commit a reuse revocation before returning the authentication failure.
        $result = DB::transaction(function () use ($credential, $client, $csrf) {
            $entry = DB::table('refresh_credentials')->where('hash', hash('sha256', $credential))->first();
            if (! $entry) {
                return null;
            }
            $session = DB::table('refresh_sessions')->where('id', $entry->session_id)->first();
            if (! $session) {
                return null;
            }
            $user = User::whereKey($session->user_id)->lockForUpdate()->first();
            $session = DB::table('refresh_sessions')->where('id', $entry->session_id)->lockForUpdate()->first();
            $entry = DB::table('refresh_credentials')->where('hash', hash('sha256', $credential))->lockForUpdate()->first();
            if (! $session || ! $entry || ! $user || ! $user->enabled || $session->revoked_at || now()->gte($session->expires_at) || $session->client !== $client) {
                return null;
            }
            if ($client === 'web' && ! hash_equals($session->csrf_hash, hash('sha256', $csrf))) {
                throw new ApiException(403, 'CSRF_INVALID', '请求校验失败');
            }
            if ($entry->used_at) {
                DB::table('refresh_sessions')->where('id', $session->id)->update(['revoked_at' => now()]);

                return null;
            }
            DB::table('refresh_credentials')->where('hash', $entry->hash)->update(['used_at' => now()]);

            return $this->issue($user, $session->id, $csrf);
        });
        if (! $result) {
            throw new ApiException(401, 'SESSION_REVOKED', '会话已失效，请重新登录');
        }

        return $result;
    }

    /** @return array<string, mixed> */
    private function issue(User $user, string $sessionId, string $csrf): array
    {
        $refresh = Str::random(80);
        DB::table('refresh_credentials')->insert(['hash' => hash('sha256', $refresh), 'session_id' => $sessionId]);
        $jwt = app(JWT::class);
        $jwt->factory()->setTTL(config('identity.access_minutes'));
        $token = $jwt->claims([
            'sid' => $sessionId, 'iss' => config('identity.issuer'), 'aud' => config('identity.audience'),
        ])->fromSubject($user);

        return ['token' => $token, 'refreshToken' => $refresh, 'csrfToken' => $csrf, 'expiresIn' => config('identity.access_minutes') * 60];
    }

    public function revokeUser(int $userId): void
    {
        DB::table('refresh_sessions')->where('user_id', $userId)->whereNull('revoked_at')->update(['revoked_at' => now()]);
    }
}
