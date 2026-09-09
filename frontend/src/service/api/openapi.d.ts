export interface paths {
  '/v1/roles': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['rolesGet'];
    put?: never;
    post: operations['rolesPost'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/permissions': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['permissionsGet'];
    put?: never;
    post: operations['permissionsPost'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/roles/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['rolesPutById'];
    post?: never;
    delete: operations['rolesDeleteById'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/permissions/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['permissionsPutById'];
    post?: never;
    delete: operations['permissionsDeleteById'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/audit-logs': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['audit.index'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['auth.login'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['auth.refresh'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['auth.me'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put?: never;
    post: operations['auth.logout'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/auth/profile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['auth.profile'];
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/dashboard': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['presentation.dashboard'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/health': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['health'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/navigation/routes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['menu.routes'];
    put?: never;
    post?: never;
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/menus': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['menu.index'];
    put?: never;
    post: operations['modules.navigation.presentation.menu.save_14'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/menus/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['modules.navigation.presentation.menu.save_15'];
    post?: never;
    delete: operations['menu.destroy'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/users': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get: operations['user.index'];
    put?: never;
    post: operations['modules.identity.presentation.user.save_10'];
    delete?: never;
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
  '/v1/users/{id}': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    get?: never;
    put: operations['modules.identity.presentation.user.save_11'];
    post?: never;
    delete: operations['user.destroy'];
    options?: never;
    head?: never;
    patch?: never;
    trace?: never;
  };
}
export type webhooks = Record<string, never>;
export interface components {
  schemas: {
    /** AccessRequest */
    AccessRequest: {
      name: string;
      version: number;
      permissionIds?: number[];
    };
    /** ApiError */
    ApiError: {
      code: string;
      msg: string;
      data: null;
      errors?: {
        [key: string]: string[];
      } | null;
    };
    /** AuditPage */
    AuditPage: {
      records: components['schemas']['AuditRecord'][];
      total: number;
      page: number;
      pageSize: number;
    };
    /** AuditRecord */
    AuditRecord: {
      id: number;
      /** Format: uuid */
      request_id: string;
      actor_id: number | null;
      actor_name: string | null;
      action: string;
      target_id: string | null;
      /** @enum {string} */
      result: 'success' | 'failure';
      status_code: number;
      error_code: string | null;
      details: {
        [key: string]: unknown;
      };
      occurred_at: string;
    };
    /** Dashboard */
    Dashboard: {
      metrics: {
        /** @enum {string} */
        key: 'users' | 'roles' | 'permissions' | 'menus';
        value: number;
      }[];
      canAudit: boolean;
      trend: {
        /** Format: date */
        date: string;
        success: number;
        failure: number;
      }[];
      recent: {
        id: number;
        actor_name: string | null;
        action: string;
        /** @enum {string} */
        result: 'success' | 'failure';
        occurred_at: string;
      }[];
      /** Format: date-time */
      generatedAt: string;
    };
    /** Identity */
    Identity: {
      userId: string;
      userName: string;
      /** Format: email */
      email: string;
      roles: string[];
      buttons: string[];
      accessVersion: number;
    };
    /** LoginRequest */
    LoginRequest: {
      /** Format: email */
      email: string;
      password: string;
      /** @enum {string} */
      client: 'web' | 'desktop';
    };
    /** MenuPage */
    MenuPage: {
      records: components['schemas']['MenuRecord'][];
      total: number;
      page: number;
      pageSize: number;
      version: number;
    };
    /** MenuRecord */
    MenuRecord: {
      id: number;
      name: string;
      title: string;
      path: string;
      component: string;
      parent_id: number | null;
      permission: string | null;
      icon: string;
      sort: number;
      enabled: number | boolean;
      children?: components['schemas']['MenuRecord'][];
      created_at?: string | null;
      updated_at?: string | null;
    };
    /** MenuRequest */
    MenuRequest: {
      name: string;
      title: string;
      path: string;
      /** @enum {string} */
      component: 'group' | 'users' | 'roles' | 'permissions' | 'menus' | 'audit' | 'docs';
      parent_id?: number | null;
      permission?: string | null;
      icon: string;
      sort: number;
      enabled: boolean;
      version: number;
    };
    /** Navigation */
    Navigation: {
      routes: components['schemas']['NavigationRoute'][];
      home: string;
    };
    /** NavigationRoute */
    NavigationRoute: {
      name: string;
      path: string;
      component: string;
      meta: {
        [key: string]: unknown;
      };
      children?: components['schemas']['NavigationRoute'][];
    };
    /** PermissionPage */
    PermissionPage: {
      records: components['schemas']['PermissionRecord'][];
      total: number;
      page: number;
      pageSize: number;
      version: number;
    };
    /** PermissionRecord */
    PermissionRecord: {
      id: number;
      name: string;
      guard_name: string;
      created_at: string | null;
      updated_at: string | null;
    };
    /** RolePage */
    RolePage: {
      records: components['schemas']['RoleRecord'][];
      total: number;
      page: number;
      pageSize: number;
      version: number;
    };
    /** RoleRecord */
    RoleRecord: {
      id: number;
      name: string;
      guard_name: string;
      permissionIds: number[];
      created_at: string | null;
      updated_at: string | null;
    };
    /** Saved */
    Saved: {
      id: number;
      version: number;
    };
    /** SavedMenu */
    SavedMenu: {
      id: number;
    };
    /** Tokens */
    Tokens: {
      token: string;
      /** @description 仅 desktop 客户端返回；Web 使用 HttpOnly Cookie */
      refreshToken?: string;
      csrfToken: string;
      /** @description 访问令牌有效期，单位秒 */
      expiresIn: number;
    };
    /** UserPage */
    UserPage: {
      records: components['schemas']['UserRecord'][];
      total: number;
      page: number;
      pageSize: number;
      version: number;
    };
    /** UserRecord */
    UserRecord: {
      id: number;
      name: string;
      email: string;
      enabled: boolean;
      roleIds: number[];
      roleNames: string[];
    };
    /** UserRequest */
    UserRequest: {
      name: string;
      /** Format: email */
      email: string;
      password: string;
      enabled: boolean;
      roleIds?: number[];
      version: number;
    };
  };
  responses: {
    /** @description Validation error */
    ValidationException: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          /** @description Errors overview. */
          message: string;
          /** @description A detailed description of each field that failed validation. */
          errors: {
            [key: string]: string[];
          };
        };
      };
    };
    /** @description Authorization error */
    AuthorizationException: {
      headers: {
        [name: string]: unknown;
      };
      content: {
        'application/json': {
          /** @description Error overview. */
          message: string;
        };
      };
    };
  };
  parameters: never;
  requestBodies: never;
  headers: never;
  pathItems: never;
}
export type $defs = Record<string, never>;
export interface operations {
  rolesGet: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        search?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['RolePage'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  rolesPost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          version: number;
          permissionIds: number[];
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  permissionsGet: {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        search?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['PermissionPage'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  permissionsPost: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          version: number;
          permissionIds?: number[];
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  rolesPutById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          version: number;
          permissionIds: number[];
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  rolesDeleteById: {
    parameters: {
      query: {
        version: number;
      };
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: null;
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  permissionsPutById: {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          version: number;
          permissionIds?: number[];
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  permissionsDeleteById: {
    parameters: {
      query: {
        version: number;
      };
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: null;
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'audit.index': {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        actor?: string | null;
        action?: string | null;
        result?: 'success' | 'failure' | null;
        requestId?: string | null;
        dateFrom?: string | null;
        dateTo?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['AuditPage'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'auth.login': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['LoginRequest'];
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Tokens'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'auth.refresh': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          /** @enum {string} */
          client: 'web' | 'desktop';
          refreshToken?: string | null;
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Tokens'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'auth.me': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Identity'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'auth.logout': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: null;
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'auth.profile': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          currentPassword?: string;
          password?: string | null;
          password_confirmation?: string | null;
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Identity'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'presentation.dashboard': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Dashboard'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  health: {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            status: 'ok';
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'menu.routes': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Navigation'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'menu.index': {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        search?: string | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['MenuPage'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'modules.navigation.presentation.menu.save_14': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MenuRequest'];
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['SavedMenu'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'modules.navigation.presentation.menu.save_15': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['MenuRequest'];
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['SavedMenu'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'menu.destroy': {
    parameters: {
      query: {
        version: number;
      };
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: null;
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'user.index': {
    parameters: {
      query?: {
        page?: number;
        pageSize?: number;
        search?: string | null;
        name?: string | null;
        email?: string | null;
        enabled?: boolean | null;
      };
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['UserPage'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'modules.identity.presentation.user.save_10': {
    parameters: {
      query?: never;
      header?: never;
      path?: never;
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': components['schemas']['UserRequest'];
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'modules.identity.presentation.user.save_11': {
    parameters: {
      query?: never;
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody: {
      content: {
        'application/json': {
          name: string;
          /** Format: email */
          email: string;
          password?: string | null;
          enabled: boolean;
          roleIds?: number[];
          version: number;
        };
      };
    };
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: components['schemas']['Saved'];
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
  'user.destroy': {
    parameters: {
      query: {
        version: number;
      };
      header?: never;
      path: {
        id: number;
      };
      cookie?: never;
    };
    requestBody?: never;
    responses: {
      /** @description 成功 */
      200: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': {
            /** @constant */
            code: '0000';
            msg: string;
            data: null;
          };
        };
      };
      /** @description 未登录、令牌过期或会话撤销 */
      401: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 无权限或来源/CSRF 校验失败 */
      403: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 记录不存在 */
      404: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 版本冲突或受保护的数据 */
      409: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 输入校验失败 */
      422: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 请求过于频繁 */
      429: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
      /** @description 服务暂时不可用 */
      500: {
        headers: {
          [name: string]: unknown;
        };
        content: {
          'application/json': components['schemas']['ApiError'];
        };
      };
    };
  };
}
