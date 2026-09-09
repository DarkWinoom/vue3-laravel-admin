# Vue3 Laravel Admin

Vue3 + Laravel 13 + MySQL 8，界面基于 soybean-admin Tauri 分支。

日常开发使用 `pnpm dev`；Docker 仅用于特定功能验证、部署测试或实际运行。

已实现邮箱登录、刷新与退出、个人资料和改密、用户/角色/权限/菜单管理、动态菜单与按钮权限、操作审计、真实统计仪表盘和本地 Swagger API 文档。授权变更使用事件溯源及同步投影，后端逐请求检查当前权限。

界面固定中文。管理页面的查询卡片、表格工具栏与抽屉/弹窗采用官方 example 分支样式；系统管理菜单包含用户、角色、权限、菜单、操作审计和 API 文档六个子页，个人中心从右上角账户菜单进入。

底部版权默认隐藏，组件保留。可在“主题配置 → 布局 → 显示底部”随时恢复；默认值由 `frontend/src/theme/settings.ts` 的 `themeSettings.footer.visible` 控制。个人中心使用满高单栏卡片，表单内容独立滚动，底部操作区保持固定位置。

Vue 组件样式统一使用 `<style lang="scss" scoped>`；需要全局作用域时保留非 scoped 样式。项目已包含 Sass，Vite 通过 `@use` 注入 `frontend/src/styles/scss/global.scss` 中的共享 mixin；页面生成模板也默认使用 SCSS。

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

### 登录账号

**普通开发环境（`pnpm dev`，默认 9527）没有默认账号。** 首次先执行 `pnpm db:migrate`，再执行 `pnpm admin:create <你的邮箱>`，按提示设置密码，随后使用该邮箱和密码登录。

**测试环境（`pnpm dev:test`，默认 9531）** 先执行 `pnpm test:seed`，再使用以下账号：

| 权限     | 登录邮箱                      | 密码                     |
| -------- | ----------------------------- | ------------------------ |
| 管理员   | `browser-admin@example.test`  | `Browser-test-password!` |
| 只读用户 | `browser-viewer@example.test` | `Browser-test-password!` |

这些账号仅存在于独立 `_testing` 库，不适用于普通开发或 Docker 数据库。运行 `pnpm test:mysql` 会清空测试账号，之后重新执行 `pnpm test:seed` 即可恢复。

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

接口前缀 `/api/v1`。成功响应为 `{code: "0000", msg, data}`；管理列表 `data` 为 `{records, total, page, pageSize, version}`，审计列表没有 `version`，每页最多 100 条。失败保留 HTTP 401/403/404/409/422/429，并返回业务错误码和字段错误。管理写请求附列表返回的 `version`，遇到 409 时刷新数据后重试。

`backend/app/Modules/Identity` 管理用户与会话，`Access` 管理授权命令、事件和投影，`Navigation` 管理菜单，`Audit` 保存操作记录，`Dashboard` 提供授权统计，`Documentation` 补齐自动生成的 API 契约。用户及菜单写入通过应用层 Commands；角色、权限和用户角色分配必须经过 Access 命令入口，不能直接改授权读表。`access:replay` 只重建授权投影，不重建用户资料或菜单。

菜单支持顶级页面或分组下的页面。顶级名称不能含下划线；子菜单名称使用 `分组名_页面名`，路径使用 `/分组路径/子路径`。可选页面组件为当前已交付的管理页面。内置权限标识如 `users.read`、`roles.update`，用于后端授权及前端按钮可见性。

默认管理路径为 `/manage/user`、`/manage/role`、`/manage/permission`、`/manage/menu`、`/manage/audit` 和 `/manage/docs`。菜单列表按顶级目录分页，并以 `children` 返回子菜单。已有默认菜单通过迁移归入“系统管理”，保留原有自定义标题、状态和权限。

## 审计、统计和 API 文档

审计只读，需 `audit.read` 权限，可按操作人、操作标识、结果、请求编号和 UTC 日期筛选。成功记录与业务写入同事务，失败记录在回滚后保存。记录只保留允许的业务字段，不保存邮箱、密码、令牌、Cookie 或请求正文；权限投影重放不会重做审计。

首页从 `/api/v1/dashboard` 获取真实计数，每项资源需对应的 `*.read` 权限；七日操作趋势和最近操作需 `audit.read`。无权查看的统计不会返回给浏览器。

“系统管理 → API 文档”需 `docs.read` 权限。文档页面和 Swagger 资源在本地打包，调试自动使用当前会话；写入调试会修改真实数据。后端 `/api/v1/openapi` 也检查权限。`API_DOCS_ENABLED` 可在对应模式 env 中显式设置；开发/测试默认开启，生产默认关闭。关闭后隐藏默认文档菜单并拒绝文档请求，Scramble 的默认公开文档路由不注册。

| 命令                  | 用途                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------ |
| `pnpm api:generate`   | 更新 `backend/openapi.json` 与 `frontend/src/service/api/openapi.d.ts`，接口变更后一起提交 |
| `pnpm api:check`      | 检查生成契约是否过期                                                                       |
| `pnpm icons:generate` | 从本地 Iconify 数据集打包代码使用的动态图标                                                |

PHP 测试通过 JSON Schema 校验器核对真实 HTTP 响应。路由及输入校验由 Scramble 推导，事务回调中的响应模型由 `Documentation/Application/ApiDocument.php` 补充。

字体使用系统字体栈，Naive UI 小字号、表格、弹窗、分页、提示、图表和 Swagger 内容统一至少 14px。动态图标使用 `@iconify/vue/offline`；菜单编辑器从已打包的本地图标中选择，历史未知图标显示本地占位，不请求 CDN。新增代码中的图标后运行 `pnpm icons:generate` 并提交图标资源。

新增依赖：`swagger-ui-dist`（Apache-2.0，用于文档界面）、`openapi-typescript`（MIT，用于契约类型）、`@redocly/ajv`（MIT，用于响应校验）、`@iconify/utils`（MIT，用于图标打包）及 Swagger 类型声明（MIT）。图标集的作者和许可保留在 `frontend/src/assets/icons/management.json`，上游许可证继续保留。

## 注意

- 联通检查使用 `/api/v1/health`。全新环境须先迁移并初始化管理员后登录。
- 本地 MySQL 测试库名称必须以 `_testing` 结尾；测试会刷新该库的表。
- 已有数据卷不要随意修改数据库密码或删除密钥；正式更新前备份数据库。
- VS Code 从根目录打开并安装推荐扩展。提交前自动执行检查，commit 标题使用英文。
- 上游来源见 `upstream.json`，保留 `frontend/LICENSE`；项目采用 MIT。
