<?php

namespace App\Modules\Documentation\Application;

use Dedoc\Scramble\Support\Generator\OpenApi;
use Dedoc\Scramble\Support\Generator\Parameter;
use Dedoc\Scramble\Support\Generator\Path;
use Dedoc\Scramble\Support\Generator\Response;
use Dedoc\Scramble\Support\Generator\Schema;
use Dedoc\Scramble\Support\Generator\SecurityRequirement;
use Dedoc\Scramble\Support\Generator\SecurityScheme;
use Dedoc\Scramble\Support\Generator\Server;

final class ApiDocument
{
    /** @param array<string, mixed> $properties
     * @param  list<string>|null  $required
     * @return array<string, mixed>
     */
    private static function object(array $properties, ?array $required = null): array
    {
        return ['type' => 'object', 'properties' => $properties, 'required' => $required ?? array_keys($properties)];
    }

    /** @param array<string, mixed> $items
     * @return array<string, mixed>
     */
    private static function list(array $items): array
    {
        return ['type' => 'array', 'items' => $items];
    }

    /** @return array<string, string> */
    private static function ref(string $name): array
    {
        return ['$ref' => '#/components/schemas/'.$name];
    }

    /** @param array<string, mixed> $definition */
    private static function schema(array $definition): Schema
    {
        return Schema::fromType(new ContractSchema($definition));
    }

    /** @return array<string, array<string, mixed>> */
    public static function definitions(): array
    {
        $string = ['type' => 'string'];
        $integer = ['type' => 'integer'];
        $boolean = ['type' => 'boolean'];
        $nullableString = ['type' => ['string', 'null']];
        $ids = self::list($integer);
        $audit = self::object([
            'id' => $integer, 'request_id' => ['type' => 'string', 'format' => 'uuid'], 'actor_id' => ['type' => ['integer', 'null']], 'actor_name' => $nullableString,
            'action' => $string, 'target_id' => $nullableString, 'result' => ['type' => 'string', 'enum' => ['success', 'failure']],
            'status_code' => $integer, 'error_code' => $nullableString, 'details' => ['type' => 'object', 'additionalProperties' => true], 'occurred_at' => $string,
        ]);
        $recent = self::object(array_intersect_key($audit['properties'], array_flip(['id', 'actor_name', 'action', 'result', 'occurred_at'])));
        $schemas = [
            'Identity' => self::object(['userId' => $string, 'userName' => $string, 'email' => ['type' => 'string', 'format' => 'email'], 'roles' => self::list($string), 'buttons' => self::list($string), 'accessVersion' => $integer]),
            'Tokens' => self::object(['token' => $string, 'refreshToken' => [...$string, 'description' => '仅 desktop 客户端返回；Web 使用 HttpOnly Cookie'], 'csrfToken' => $string, 'expiresIn' => ['type' => 'integer', 'description' => '访问令牌有效期，单位秒']], ['token', 'csrfToken', 'expiresIn']),
            'UserRecord' => self::object(['id' => $integer, 'name' => $string, 'email' => $string, 'enabled' => $boolean, 'roleIds' => $ids, 'roleNames' => self::list($string)]),
            'PermissionRecord' => self::object(['id' => $integer, 'name' => $string, 'guard_name' => $string, 'created_at' => $nullableString, 'updated_at' => $nullableString]),
            'RoleRecord' => self::object(['id' => $integer, 'name' => $string, 'guard_name' => $string, 'permissionIds' => $ids, 'created_at' => $nullableString, 'updated_at' => $nullableString]),
            'MenuRecord' => self::object(['id' => $integer, 'name' => $string, 'title' => $string, 'path' => $string, 'component' => $string, 'parent_id' => ['type' => ['integer', 'null']], 'permission' => $nullableString, 'icon' => $string, 'sort' => $integer, 'enabled' => ['type' => ['integer', 'boolean']], 'children' => self::list(self::ref('MenuRecord')), 'created_at' => $nullableString, 'updated_at' => $nullableString], ['id', 'name', 'title', 'path', 'component', 'parent_id', 'permission', 'icon', 'sort', 'enabled']),
            'AuditRecord' => $audit,
            'Dashboard' => self::object([
                'metrics' => self::list(self::object(['key' => ['type' => 'string', 'enum' => ['users', 'roles', 'permissions', 'menus']], 'value' => $integer])), 'canAudit' => $boolean,
                'trend' => self::list(self::object(['date' => ['type' => 'string', 'format' => 'date'], 'success' => $integer, 'failure' => $integer])),
                'recent' => self::list($recent), 'generatedAt' => ['type' => 'string', 'format' => 'date-time'],
            ]),
            'NavigationRoute' => self::object(['name' => $string, 'path' => $string, 'component' => $string, 'meta' => ['type' => 'object', 'additionalProperties' => true], 'children' => self::list(self::ref('NavigationRoute'))], ['name', 'path', 'component', 'meta']),
            'Navigation' => self::object(['routes' => self::list(self::ref('NavigationRoute')), 'home' => $string]),
            'Saved' => self::object(['id' => $integer, 'version' => $integer]),
            'SavedMenu' => self::object(['id' => $integer]),
            'ApiError' => self::object(['code' => $string, 'msg' => $string, 'data' => ['type' => 'null'], 'errors' => ['type' => ['object', 'null'], 'additionalProperties' => self::list($string)]], ['code', 'msg', 'data']),
        ];
        foreach (['User', 'Role', 'Permission', 'Menu', 'Audit'] as $name) {
            $fields = ['records' => self::list(self::ref($name.'Record')), 'total' => $integer, 'page' => $integer, 'pageSize' => $integer];
            if ($name !== 'Audit') {
                $fields['version'] = $integer;
            }
            $schemas[$name.'Page'] = self::object($fields);
        }

        return $schemas;
    }

    public function __invoke(OpenApi $document): void
    {
        $document->info->description = '管理 API。成功包络 code=0000；失败使用对应 HTTP 状态及业务 code。写入管理数据须提交最新列表 version，冲突返回 409。Web 登录使用 HttpOnly 刷新 Cookie，刷新及退出须带 X-CSRF-Token；desktop 使用响应中的 refreshToken。所有统计按实时权限过滤，审计时间使用 UTC。';
        $document->servers = [new Server('/api')];
        $document->secure(SecurityScheme::http('bearer', 'JWT')->as('bearerAuth'));
        foreach (self::definitions() as $name => $schema) {
            $document->components->addSchema($name, self::schema($schema));
        }
        // Expand the two allowed resource values without changing Laravel dispatch semantics.
        $paths = [];
        foreach ($document->paths as $path) {
            if (! str_contains($path->path, '{resource}')) {
                $paths[] = $path;

                continue;
            }
            foreach (['roles', 'permissions'] as $resource) {
                $copy = new Path(str_replace('{resource}', $resource, $path->path));
                foreach ($path->operations as $method => $operation) {
                    $op = clone $operation;
                    $op->parameters = array_values(array_filter($op->parameters, fn ($p) => ! ($p instanceof Parameter) || $p->name !== 'resource'));
                    $op->operationId = $resource.ucfirst($method).(str_contains($path->path, '{id}') ? 'ById' : '');
                    if (in_array($method, ['post', 'put'], true)) {
                        $body = collect($document->components->schemas)->first(fn ($s, $key) => str_ends_with($key, 'AccessRequest'))->toArray();
                        $body['required'] = $resource === 'roles' ? ['name', 'version', 'permissionIds'] : ['name', 'version'];
                        $op->requestBodyObject = clone $operation->requestBodyObject;
                        $op->requestBodyObject->content['application/json'] = self::schema($body);
                    }
                    $copy->addOperation($op);
                }
                $paths[] = $copy;
            }
        }
        $document->paths = $paths;
        foreach ($paths as $path) {
            foreach ($path->operations as $method => $operation) {
                $uri = '/'.trim($path->path, '/');
                $public = in_array($uri, ['/v1/health', '/v1/auth/login', '/v1/auth/refresh'], true);
                $operation->security = [new SecurityRequirement($public ? [] : ['bearerAuth' => []])];
                if ($uri === '/v1/auth/refresh') {
                    $operation->requestBodyObject->content['application/json'] = self::schema(['oneOf' => [
                        self::object(['client' => ['type' => 'string', 'const' => 'web'], 'refreshToken' => ['type' => ['string', 'null'], 'maxLength' => 100]], ['client']),
                        self::object(['client' => ['type' => 'string', 'const' => 'desktop'], 'refreshToken' => ['type' => 'string', 'minLength' => 1, 'maxLength' => 100]]),
                    ]]);
                }
                if (in_array($uri, ['/v1/auth/refresh', '/v1/auth/logout'], true)) {
                    $csrf = Parameter::make('X-CSRF-Token', 'header');
                    $csrf->description = 'Web 客户端必填，使用登录响应中的 csrfToken；desktop 无需此字段。';
                    $csrf->schema = self::schema(['type' => 'string']);
                    $operation->parameters[] = $csrf;
                }
                foreach ($operation->parameters as $parameter) {
                    if ($parameter instanceof Parameter && $parameter->name === 'id') {
                        $parameter->schema = self::schema(['type' => 'integer', 'minimum' => 1]);
                    }
                }
                if ($uri === '/v1/users/{id}' && $method === 'put') {
                    $body = collect($document->components->schemas)->first(fn ($s, $key) => str_ends_with($key, 'UserRequest'))->toArray();
                    $body['required'] = array_values(array_diff($body['required'], ['password']));
                    $body['properties']['password']['type'] = ['string', 'null'];
                    $operation->requestBodyObject->content['application/json'] = self::schema($body);
                }
                $schema = match (true) {
                    $uri === '/v1/health' => null,
                    in_array($uri, ['/v1/auth/login', '/v1/auth/refresh'], true) => 'Tokens',
                    in_array($uri, ['/v1/auth/me', '/v1/auth/profile'], true) => 'Identity',
                    $uri === '/v1/navigation/routes' => 'Navigation',
                    $uri === '/v1/dashboard' => 'Dashboard',
                    $uri === '/v1/audit-logs' => 'AuditPage',
                    $method === 'get' => match ($uri) {
                        '/v1/users' => 'UserPage', '/v1/roles' => 'RolePage', '/v1/permissions' => 'PermissionPage', '/v1/menus' => 'MenuPage', default => throw new \LogicException('Missing response contract: '.$uri)
                    },
                    $method === 'delete' || $uri === '/v1/auth/logout' => null,
                    str_starts_with($uri, '/v1/menus') => 'SavedMenu',
                    default => 'Saved',
                };
                $success = $uri === '/v1/health' ? self::object(['status' => ['type' => 'string', 'const' => 'ok']]) : self::object(['code' => ['type' => 'string', 'const' => '0000'], 'msg' => ['type' => 'string'], 'data' => $schema ? self::ref($schema) : ['type' => 'null']]);
                $operation->responses = [Response::make(200)->setDescription('成功')->setContent('application/json', self::schema($success))];
                foreach ([401 => '未登录、令牌过期或会话撤销', 403 => '无权限或来源/CSRF 校验失败', 404 => '记录不存在', 409 => '版本冲突或受保护的数据', 422 => '输入校验失败', 429 => '请求过于频繁', 500 => '服务暂时不可用'] as $status => $description) {
                    $operation->addResponse(Response::make($status)->setDescription($description)->setContent('application/json', self::schema(self::ref('ApiError'))));
                }
            }
        }
    }
}
