# Vue3 Laravel Admin

Vue3 + Laravel 13 + MySQL 8，界面基于 soybean-admin Tauri 分支。

日常开发使用 `pnpm dev`；Docker 仅用于特定功能验证、部署测试或实际运行。

已实现邮箱登录、刷新与退出、个人资料和改密、用户/角色/权限/菜单管理、动态菜单与按钮权限。授权变更使用事件溯源及同步投影，后端逐请求检查当前权限。

## 目录

```text
frontend/       前端与 Tauri
backend/        Laravel API
scripts/        环境初始化、联调和 Docker 命令
docker/         Dockerfile、Nginx 与启动配置
.vscode/        编辑器设置
compose.yaml    Docker 服务编排
.env*           根目录环境配置及示例
upstream.json   上游分支与 commit 记录
```

## Docker 部署（推荐）

安装 Docker 与 Node/pnpm，在根目录执行：

```sh
pnpm docker:up                 # 一键部署测试环境，默认 http://localhost:8080
pnpm docker:update             # 用当前代码重建、更新并迁移数据库
pnpm docker:down               # 停止测试环境，保留数据
pnpm docker:up production      # 部署生产配置，默认 8081
pnpm docker:update production  # 更新生产环境
```

首次自动生成 env 与随机密钥。镜像内安装前后端依赖，包含 Nginx、PHP-FPM 和独立 MySQL。测试与生产使用独立容器和数据卷；更新不会执行 git pull，也不会清空数据库。

容器首次部署后，在根目录运行 `docker compose --env-file .env.testing exec api php artisan admin:create admin@example.com`，按提示设置首位管理员密码。生产环境使用对应的 `.env.production`。

## 本地联调

本机准备 Node 22.19+、pnpm 11、PHP 8.4、Composer 和 MySQL，根目录运行：

```sh
pnpm install
pnpm run setup       # 仅生成缺失的根 env，不覆盖已有配置
pnpm install:local   # 安装前后端依赖
pnpm db:migrate
pnpm admin:create admin@example.com  # 首次初始化，交互输入至少 12 位密码
pnpm dev             # 同时启动前端 9527 与 API 8000；Ctrl+C 一起停止
```

| 命令                               | 用途                                                         |
| ---------------------------------- | ------------------------------------------------------------ |
| `pnpm dev:desktop`                 | Tauri 与 API 联调，需本机 Rust/Tauri 工具链                  |
| `pnpm test` / `pnpm test:mysql`    | 内存测试 / 独立 MySQL 测试库                                 |
| `pnpm check`                       | 类型、格式、静态检查                                         |
| `pnpm fmt`                         | 格式化前端和脚本                                             |
| `pnpm build:web`                   | 生产模式 Web 构建                                            |
| `pnpm admin:create <email>`        | 初始化首位管理员，已有管理员时拒绝重复初始化                 |
| `pnpm access:replay`               | 在事务中从授权事件重建角色、权限和用户角色投影               |
| `pnpm test:seed` / `pnpm dev:test` | 初始化测试账户 / 本地连接测试库联调，默认前端 9531、API 8011 |

首次管理员初始化同时创建内置权限和管理菜单。后续账户从用户管理创建，角色分配需要 `roles.update` 权限；内置 `admin` 角色受保护，禁止禁用、删除或移除最后一位可用管理员。

测试联调先运行 `pnpm test:seed`，再运行 `pnpm dev:test`。仅在独立 `_testing` 数据库生成 `browser-admin@example.test` 和 `browser-viewer@example.test`，两者的测试密码为 `Browser-test-password!`；后者仅可读取用户列表。这些固定测试账户不会由普通迁移或生产部署创建。

## 配置

所有实际 env 均在根目录且不提交 Git，子目录仅保留独立运行用的 `.env.example`。

| 文件               | 配置内容                               |
| ------------------ | -------------------------------------- |
| `.env`             | 前端公共设置，如标题、主题相关变量     |
| `.env.development` | 本地开发：`DB_*`、前后端端口、应用密钥 |
| `.env.testing`     | 测试库、Docker 测试端口和密钥          |
| `.env.production`  | 生产地址、Docker 端口和密钥            |

本地连接使用 `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD`；Docker 内数据库地址和账号由 Compose 设置，使用 `DOCKER_DB_PASSWORD` 和 `MYSQL_ROOT_PASSWORD`。`DOCKER_HTTP_PORT` 控制容器对外端口，`APP_URL` 设置访问地址。`VITE_*` 属于前端公开配置，不能放数据库密码或服务端密钥，修改后需重新构建。

认证配置位于对应模式的 env：`JWT_TTL` 为访问令牌分钟数（默认 15），`REFRESH_TTL` 为刷新会话分钟数（默认 10080），`JWT_ISSUER` 为固定签发方。`AUTH_ALLOWED_ORIGINS` 为逗号分隔的浏览器/桌面来源白名单；本地默认包含 Vite 地址，生产默认仅 `APP_URL`，额外桌面来源需显式添加。生产 Web 使用 HTTPS，并通过同站点 API 代理发送 Cookie。

Web 访问令牌只保存在内存，刷新凭据为 HttpOnly Cookie，刷新和退出校验 CSRF。桌面凭据仅驻留内存，重开应用需重新登录。同页面并发请求合并刷新；已消费的刷新凭据被再次使用会撤销整条会话。修改密码、禁用账户及退出会使相关会话失效。

## API 与模块

接口前缀 `/api/v1`。成功响应为 `{code: "0000", msg, data}`；列表 `data` 为 `{records, total, page, pageSize, version}`，每页最多 100 条。失败保留 HTTP 401/403/404/409/422/429，并返回业务错误码和字段错误。管理写请求附列表返回的 `version`，遇到 409 时刷新数据后重试。

`backend/app/Modules/Identity` 管理用户与会话，`Access` 管理授权命令、事件和投影，`Navigation` 管理菜单。用户及菜单写入通过应用层 Commands；角色、权限和用户角色分配必须经过 Access 命令入口，不能直接改授权读表。`access:replay` 只重建授权投影，不重建用户资料或菜单。

菜单支持顶级页面或分组下的页面。顶级名称不能含下划线；子菜单名称使用 `分组名_页面名`，路径使用 `/分组路径/子路径`。可选页面组件为当前已交付的管理页面。内置权限标识如 `users.read`、`roles.update`，用于后端授权及前端按钮可见性。

## 注意

- 联通检查使用 `/api/v1/health`。全新环境须先迁移并初始化管理员后登录。
- 本地 MySQL 测试库名称必须以 `_testing` 结尾；测试会刷新该库的表。
- 已有数据卷不要随意修改数据库密码或删除密钥；正式更新前备份数据库。
- VS Code 从根目录打开并安装推荐扩展。提交前自动执行检查，commit 标题使用英文。
- 上游来源见 `upstream.json`，保留 `frontend/LICENSE`；项目采用 MIT。
