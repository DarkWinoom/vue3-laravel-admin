# Vue3 Laravel Admin 开发与部署详解

这是可选的技术说明。部署与 AI 定制的简明入口见 [使用指南](README.md)。

Vue3 + Laravel 13 + MySQL 8，界面基于 soybean-admin Tauri 分支。

日常开发使用 `pnpm dev`；Docker 用于部署、验证和实际运行。Web/API 与桌面共用业务界面，已接入三平台 CI、原生业务测试及草稿发布工作流；实际构建和验收结果以 Actions 与 Release 记录为准。

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

认证配置位于对应模式的 env：`JWT_TTL` 为访问令牌分钟数（默认 15），`REFRESH_TTL` 为刷新会话分钟数（默认 10080），`JWT_ISSUER` 为固定签发方。`AUTH_ALLOWED_ORIGINS` 为逗号分隔的浏览器/桌面来源白名单；本地默认包含 Vite 地址，生产默认包含 `APP_URL` 和 Tauri 桌面来源，自定义白名单时需一并保留实际桌面来源。生产 Web 使用 HTTPS，并通过同站点 API 代理发送 Cookie。

Web 访问令牌只保存在内存，刷新凭据为 HttpOnly Cookie，刷新和退出校验 CSRF。桌面凭据仅驻留内存，重开应用需重新登录。同页面并发请求合并刷新；切换登录身份后，旧请求结果会被丢弃，旧写请求不会用新账户的令牌重试；已消费的刷新凭据被再次使用会撤销整条会话。修改密码、禁用账户及退出会使相关会话失效。

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

契约导出会在临时 SQLite 中执行迁移，不需要外部 MySQL，也不读写业务数据库；生成结果仍由独立 MySQL 集成测试验证。

PHP 测试通过 JSON Schema 校验器核对真实 HTTP 响应。路由及输入校验由 Scramble 推导，事务回调中的响应模型由 `Documentation/Application/ApiDocument.php` 补充。

字体使用系统字体栈，Naive UI 小字号、表格、弹窗、分页、提示、图表和 Swagger 内容统一至少 14px。动态图标使用 `@iconify/vue/offline`；菜单编辑器从已打包的本地图标中选择，历史未知图标显示本地占位，不请求 CDN。新增代码中的图标后运行 `pnpm icons:generate` 并提交图标资源。

新增依赖：`swagger-ui-dist`（Apache-2.0，用于文档界面）、`openapi-typescript`（MIT，用于契约类型）、`@redocly/ajv`（MIT，用于响应校验）、`@iconify/utils`（MIT，用于图标打包）及 Swagger 类型声明（MIT）。图标集的作者和许可保留在 `frontend/src/assets/icons/management.json`，上游许可证继续保留。

## 注意

- 联通检查使用 `/api/v1/health`。全新环境须先迁移并初始化管理员后登录。
- 本地 MySQL 测试库名称必须以 `_testing` 结尾；测试会刷新该库的表。
- 已有数据卷不要随意修改数据库密码或删除密钥；正式更新前备份数据库。
- VS Code 从根目录打开并安装推荐扩展。提交前自动执行检查，commit 标题使用英文。
- 上游来源见 `upstream.json`，保留 `frontend/LICENSE`；项目采用 MIT。

## 正式部署与日常维护

Docker 脚本只使用 Node 内置模块，因此也可以不用 pnpm 执行 `node scripts/docker.mjs up|update|down [testing|production]`。它与上方 pnpm 别名调用同一实现，不要求宿主机先装 PHP、MySQL 或前端依赖。

1. 执行 `node scripts/setup.mjs` 生成缺失的配置。
2. 编辑 `.env.production`：设置真实 `APP_URL`、对外端口及部署配置，保持生成的密钥。`VITE_SERVICE_BASE_URL=/proxy-default` 适合同站点代理。
3. 配置域名和 HTTPS 反向代理，再执行 `node scripts/docker.mjs up production`。项目内 Nginx 不自动申请证书；生产 Cookie 使用 Secure，登录必须通过 HTTPS。
4. 首次执行 `docker compose --env-file .env.production exec api php artisan admin:create <邮箱>` 并交互设置密码。
5. 更新前备份数据库及根 env，在确认的业务源码版本运行 `node scripts/docker.mjs update production`，验证登录和关键业务。

`update` 重建当前工作区代码并运行增量迁移，不拉取 Git，也不删除数据卷。`down` 保留卷；不要用删除卷来解决升级失败。代码回退不等于数据库回退，涉及结构变化时根据对应迁移和备份恢复。

| 现象                    | 先检查                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Docker 启动失败         | Docker 是否运行、端口是否占用、`docker compose --env-file .env.testing ps` 与对应服务日志 |
| 无法登录                | 环境是否选对、管理员是否初始化；正式部署是否使用 HTTPS；测试账号仅属于专用本地测试库      |
| AI 改完页面但部署没变化 | 是否在业务源码目录运行 update；生产需指定 production；是否构建了正确 env                  |
| 新页面没有菜单          | 菜单记录、组件注册、角色读取权限是否齐全；已有数据库是否执行了新增迁移                    |
| 409 版本冲突            | 重新读取列表，再提交最新版本，不能取消版本验证                                            |
| API 文档不可见          | 是否有 docs.read，以及对应环境 API_DOCS_ENABLED 配置                                      |

## Skill 安装和使用规范

本项目提供一个完整的功能开发 skill：`vue3-laravel-admin`，源码位于 [SKILL.md](.agents/skills/vue3-laravel-admin/SKILL.md)。指引可单独复制/安装，不需要维护者内部文档，也不依赖额外的 Vue/Laravel skills。

### 安装范围

下列命令使用 [Agent Skills 官方 CLI](https://github.com/vercel-labs/skills#install-a-skill)。`--agent` 指定助手，`--global` 安装到用户范围，`--copy` 使用独立副本而非符号链接。

```sh
# 全局安装：尚未克隆业务基座时也可执行
npx skills add DarkWinoom/vue3-laravel-admin --skill vue3-laravel-admin --agent codex --global --copy

# 查看远端提供的 skill，不安装
npx skills add DarkWinoom/vue3-laravel-admin --list

# 在已克隆的本项目根目录安装当前本地版本
npx skills add . --skill vue3-laravel-admin --agent codex --global --copy

# 例如安装给 Claude Code；Cursor 的 agent 名为 cursor
npx skills add DarkWinoom/vue3-laravel-admin --skill vue3-laravel-admin --agent claude-code --global --copy
```

随仓库使用时，直接指定 AI 读取 `.agents/skills/vue3-laravel-admin/SKILL.md` 即可；支持项目级发现的助手也可以自动发现。只希望对一个工作目录安装时，省略 `--global`，不要在无关项目中安装后覆盖原项目。安装后新开会话；目录仍未显示时重新启动助手。

远端命令需要目标分支已经包含 skill。尚未推送的本地开发版本用 `add .` 验证，不能将本地成功安装当作远端已经发布。需要固定版本时使用完整 GitHub tree URL 中的 tag/commit，而不是默认分支。

### 使用、更新与移除

- 新项目：明确目标目录与需求。Skill 优先克隆本仓库，记录实际版本，再实现功能；不会从空白工程重造基座。
- 已有派生项目：在该项目根目录启动助手，使用 `$vue3-laravel-admin` 描述改动。保留当前框架、环境和用户修改，不自动升级基座或重置 Git。
- 纯界面调整：只改相关组件、样式与必要状态，不附带数据库、发布流程改造。
- 完整业务：说明字段、筛选、操作与角色权限，验收时检查真实数据、权限拒绝和部署后的入口。
- 新业务不自动推回基座原仓库；使用者决定自己的 Git 远端及部署目标。

```sh
npx skills list --global
npx skills update vue3-laravel-admin --global
npx skills remove vue3-laravel-admin --agent codex --global
```

更新 skill 只更新开发指引，不会同步业务源码。更新前保存对安装副本的本地修改；项目定制应在仓库内维护自己的 skill 版本，并随相关代码提交。没有 CLI 的助手可按自身安装规范复制整个 skill 文件夹，包含 references 和 agents；不能只复制 SKILL.md。

### Skill 的维护结构

- `SKILL.md`：名称/描述、基座选择、开发流程和关键边界。
- `references/setup-and-checks.md`：本地/Docker 启动及按改动选择的检查矩阵。
- `references/frontend.md`：组件入口、菜单接线、样式和交互约定。
- `references/backend.md`：模块、事务、权限、审计和 API 契约。
- `references/desktop-and-release.md`：按需使用的桌面、CI、发布及上游同步边界。
- `agents/openai.yaml`：Codex 显示名称和默认提示，不绑定额外插件。
- `LICENSE`：随独立安装副本保留的 MIT 授权。

保持文件夹名与 frontmatter.name 一致，描述明确适用范围，引用使用包内相对路径；业务项目文件路径均相对于业务仓库根目录。更新真实命令、目录结构或约束时同步这些引用，不将私有环境信息、绝对机器路径或内部施工记录作为依赖。

## 新功能的最短接线路径

1. 复用 `frontend/src/components/management` 等现有组件，在独立功能目录实现 UI 与 composable；`views` 页面只做组合。
2. 新增 Laravel 模块、必要迁移、权限及 API，写入经应用层与事务，查询经 Query；不绕过 Access 授权事件。
3. 新建页面让 Elegant Router 生成路由；在 `MenuQuery::VIEWS` 注册后端组件键，并补充菜单编辑器选项、中文路由文案和数据库菜单。MenuRequest 自动使用该映射，路由存在判断自动使用生成表。
4. 在 `ApiDocument` 中补齐响应契约，运行 `pnpm api:generate`；动态图标运行 `pnpm icons:generate`。
5. 完成相关检查和权限/页面验收。完整约束与按需阅读入口见仓库内 skill。

不要手工修改生成的路由文件或类型。新增菜单只修改初始化器无法升级已有部署，应提供新的增量迁移。需要不同于当前静态两层菜单、单租户或会话设计的行为时，先明确产品变化及其影响，再同步实现与 skill。

## 桌面客户端与构建

桌面端连接同一套 Laravel API，不内置 PHP、MySQL 或业务数据。正式构建首次启动显示“桌面设置”，填写不含路径的 HTTPS 服务地址，例如 `https://admin.example.com`；不要添加 `/api/v1`。登录页或账户菜单中的“连接与更新”可修改地址，更换服务会退出当前账号。只保存服务地址，关闭重开后需要重新登录。

应用名称和标识集中在 `desktop.json`；应用版本以根 `package.json.version` 为准，由构建脚本传给 Tauri 和界面。现有图标来自保留许可的 Soybean 基座，替换品牌图标时使用 Tauri 图标生成工具更新 `frontend/src-tauri/icons`。派生应用应修改名称、标识和更新地址，避免与原应用共享安装身份或更新源。

本地需要 `rust-toolchain.toml` 固定的 Rust 1.97.1（含 rustfmt/clippy）以及 [Tauri 系统依赖](https://v2.tauri.app/start/prerequisites/)。Windows 需要 MSVC C++ 构建工具和 WebView2，Linux 使用 WebKitGTK 4.1。CI 使用 Node 24.19.0、pnpm 11.5.0、PHP 8.4 和锁文件安装。

```sh
pnpm dev:desktop                  # 开发 API，默认 8000
pnpm dev:desktop:test             # 测试 API，默认 8011，先执行 test:seed
pnpm build:desktop                # 当前操作系统的生产包，首次配置服务
node scripts/desktop.mjs build --api https://admin.example.com
pnpm check:desktop                # Web 构建、Rust 格式及 Clippy
```

生产模式不接受 HTTP API；开发/测试只额外允许本机 HTTP。后端生产默认允许 APP_URL 和 `tauri://localhost`、`https://tauri.localhost`、`http://tauri.localhost`；若设置了 `AUTH_ALLOWED_ORIGINS`，必须在自定义列表中包含实际桌面来源。CSP 只允许本地脚本、字体及图标，连接允许 HTTPS 以支持首次配置服务；capabilities 仅提供更新、重启和 HTTPS 外链所需能力。

CI 目标为 Windows x86_64（NSIS exe）、macOS Apple Silicon（dmg）和 Linux x86_64（AppImage/deb），其他架构未列入此矩阵。下载与检查记录在当前仓库的 **Actions → Quality and desktop**；草稿 Release 仅仓库有权限的验收者可见，普通用户应使用已发布的版本。

## 自动化检查与依赖同步

`ci.yml` 对仓库默认分支的 push、PR 和手动运行执行检查，并复用仓库内的 `checks.yml`。质量任务覆盖类型、lint、格式、Pint、PHPStan、Node/SQLite/MySQL、OpenAPI 漂移、浏览器 E2E 和 Web 构建；三个原生任务各自编译、运行 WebView 业务与签名升级测试，生成生产包并验证安装、启动和卸载。PR 不读取签名私钥。手动运行 Quality and desktop 时可勾选 `portability`，在一次性 runner 中使用派生应用名称和独立二进制验证普通构建、签名测试及安装卸载；该模式的产物用于验收。失败时保留浏览器报告或原生截图，成功产物附带校验和及依赖许可记录，安装包内同时保留项目与 Soybean 的许可证文件。

```sh
pnpm --dir frontend exec playwright install chromium
pnpm test:e2e
# 原生测试会使用专用 SQLite 临时库及 8021/4445 端口
node scripts/desktop.mjs build --mode testing --api http://127.0.0.1:8021 --debug --no-bundle --features desktop-e2e
pnpm test:desktop
pnpm upstream:check
```

Linux 原生测试用 `xvfb-run -a node scripts/native-e2e.mjs`。测试应用使用独立的 `.e2e` 标识及 Test 名称；WebDriver 仅为测试 feature，Rust 拒绝把它编译进 release profile。不要分发这些调试二进制文件。

自动创建上游草稿 PR 需要在仓库 Settings → Actions → General 开启 “Allow GitHub Actions to create and approve pull requests”。GitHub 将创建和审批权限合并在此开关中；现有工作流只创建草稿，不审批或合并。默认工作流权限保持只读，由具体工作流声明所需权限。修改这项仓库权限前应获得仓库维护者授权。

Dependabot 分别为根 pnpm、前端 pnpm、Composer、Cargo 和 Actions 创建更新 PR。上游工作流每周及手动检测 `upstream.json` 中的 tauri/example SHA；存在变化时保存二进制差异补丁，并尝试向当前默认分支创建仅含候选 SHA 的草稿 PR；失败时在工作流摘要提供手动审查入口，补丁产物仍可下载。它不应用补丁，也不推进基线。先审查差异，在自己的分支选择性移植并处理冲突，通过项目检查后再更新基线；关闭的同 SHA 提案不会重复创建。

## 在自己的 GitHub 仓库发布

工作流随源码保存在当前仓库，不依赖原作者的 Actions 或历史运行记录。支持 GitHub.com 公开仓库的 fork、模板创建以及复制源码后推送到自己的仓库；默认分支名称不限。组织策略、Actions 启用状态和可用 runner 仍由仓库维护者管理。GitHub Enterprise Server 未列入三平台验收范围。

### 一次性初始化

先创建自己的 GitHub 仓库，并让本地 `origin` 指向它。在业务仓库根目录完成初始化：

```sh
pnpm install --frozen-lockfile
git remote set-url origin https://github.com/YOUR-OWNER/YOUR-REPO.git
pnpm project:init --name "我的管理系统"
```

`YOUR-OWNER/YOUR-REPO` 替换为自己的仓库。命令只修改本地配置；不会创建远端仓库、推送代码或修改仓库权限。安装并登录 GitHub CLI 时会读取仓库 ID，仓库改名后仍可识别同一应用；没有 CLI 也能按远端名称完成初始化。`--offline` 跳过仓库 API 查询，`--repository owner/repo` 可显式指定仓库，但仍需保证实际推送目标与其一致。

新派生项目默认使用 **basic** 普通发布：生成独立应用标识和二进制名称，清除继承的更新公钥、端点覆盖和发布环境。重复运行保留本应用的标识、密钥及发布模式；应用名称可再通过 `--name` 调整。可在首次初始化时用 `--identifier com.example.admin` 指定标识，已经发行的应用不要重新生成标识或密钥。

初始化后提交 `desktop.json` 和发生变化的 Tauri/Cargo 配置。根 `package.json.version` 为版本来源；初始化和版本命令会同步 Tauri、Cargo.toml 与 Cargo.lock，输出符合项目格式规则。许可证和上游来源保持原样。

### 发布模式与配置

| desktop.json 字段            | 作用                                                                     |
| ---------------------------- | ------------------------------------------------------------------------ |
| `productName` / `identifier` | 桌面名称与稳定应用身份                                                   |
| `binaryName`                 | 派生项目独立二进制名称；未设置时沿用 Cargo/Tauri 名称                    |
| `repository`                 | 初始化记录的仓库名称、可选 ID 和 GitHub 服务地址，防止误用其他应用身份   |
| `releaseMode`                | `basic` 普通安装包；`updater` 安装包及签名在线更新                       |
| `updaterPublicKey`           | 可提交的更新公钥，私钥放入 Secrets                                       |
| `updateEndpoint`             | 留空时自动使用当前仓库的最新公开 Release；自建更新服务可覆盖为 HTTPS URL |
| `releaseEnvironment`         | 留空不使用发布环境；需要人工审批或环境 Secrets 时填写已配置环境名称      |

原项目保留已有标识、`updater` 模式和 `desktop-release` 保护环境，以兼容已有客户端。派生项目无需复制原仓库 Secrets。初始化之前执行桌面构建或发布会提示仓库绑定不匹配，应先完成初始化，避免将原版更新推送给定制应用。

普通模式不需要更新密钥，不生成 `latest.json`，客户端关闭在线更新；通过安装新版更新。启用 updater 后，签名发布缺少私钥或公钥会失败，不会自动降级为普通发布。两种模式都生成三平台安装包、校验和及许可清单。

生产 API 可继续留空，由用户首次启动填写 HTTPS 服务地址。GitHub 仓库信息不会被当作 API 地址。私有仓库可以运行 CI 和 Release，但私有 Release 无法被客户端匿名读取；需要公开分发渠道或带认证的更新服务，不能把 GitHub 访问令牌放进客户端。

### 发布一个版本

```sh
pnpm project:version 0.1.2
git add package.json desktop.json frontend/src-tauri
git commit -m "chore: prepare desktop release"
git push origin HEAD
git tag v0.1.2
git push origin v0.1.2
```

版本仅为示例，替换为下一个实际版本，不覆盖已有标签。先将源码提交推送到仓库默认分支，再推送与版本一致的 `v*` 标签。也可从默认分支手动运行 **Draft desktop release** 并填写已有标签。

发布流程核对标签、版本和默认分支祖先关系，固定目标提交，调用仓库内 `checks.yml` 完成 Web/API/MySQL 与三平台原生检查后再构建发布包，不要求该 SHA 事先存在历史 CI 记录。所有平台成功且版本、源码 SHA、应用身份一致才会创建或更新**草稿 Release**；已公开 Release 不允许覆盖；草稿中存在本次构建未提供的额外附件时，停止覆盖并提示维护者手动审查，不自动删除附件。

普通检查使用只读权限，发布草稿的任务申请 `contents: write`，通常无需额外 PAT。若组织策略禁止 Actions 写入，需要维护者调整策略或手动上传构建产物。fork 的 Actions 可能需要在仓库 Actions 页面首次启用。

验收安装、连接服务和关键业务后，由维护者公开草稿。启用在线更新时还应验证真实签名升级。默认更新地址只读取最新公开 Release；草稿不会推送给普通客户端。仓库改名不会改变已安装客户端内的旧地址，应保留旧分发入口并安排一次更新地址迁移。

## 签名更新与系统签名

更新使用 [Tauri updater](https://v2.tauri.app/plugin/updater/)，入口为“连接与更新 → 版本与更新”。界面显示说明、下载进度、失败重试和重启。Windows 安装器启动后退出应用；macOS/Linux 安装完成后点击重启。

### 首次启用自动更新

先安装前端依赖，再为当前派生应用创建一次密钥：

```sh
pnpm --dir frontend install --frozen-lockfile
pnpm project:init --updater
```

命令将公钥写入 `desktop.json`，私钥备份保存在 Git 忽略的 `.release-keys/<应用标识>.key`，并保留对应 `.pub` 文件。请另存一份安全备份。重复执行复用已有密钥；已启用 updater 却缺少备份时拒绝重新生成，防止旧客户端失去升级能力。

在当前仓库 Settings → Secrets and variables → Actions 添加 `TAURI_SIGNING_PRIVATE_KEY`，值为私钥文件内容。新命令生成的密钥无密码；自行生成的加密密钥还需配置 `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`。历史项目仍支持使用 `DESKTOP_UPDATER_PUBLIC_KEY` Secret 提供公钥；使用该方式时保持它与提交的公钥一致。

已登录且有仓库管理权限的 GitHub CLI 可代为上传新命令管理的密钥：

```sh
gh auth login
pnpm project:init --updater --upload-secrets
```

`--upload-secrets` 明确授权写入所选仓库的更新私钥及空密码 Secret；有 `releaseEnvironment` 时写入该环境。它不创建保护规则、不调整仓库权限。上传失败会保留配置和本地备份，可修复权限后重试。已有加密密钥或原项目使用其他备份路径时，按手动 Secrets 方式维护，不用初始化命令轮换密钥。

公钥可进入客户端，私钥及密码只能由进程环境或 Actions Secrets 注入，不从根 env 读取，不提交 Git，也不打印到构建日志。独立安装 skill 本身不需要这些凭据；只有需要发布自动更新的业务项目才需配置。

### 发布保护与系统证书

`releaseEnvironment` 可指定 GitHub Environment。保护规则和环境 Secrets 需维护者自行配置；仅填写环境名称不等于已经启用保护。可将来源限制为自己的默认分支和 `v*` 标签，并按需要求人工审批。现有原项目的保护环境继续沿用。

Tauri 更新签名与操作系统代码签名相互独立。可选凭据：

| 平台    | Actions 配置                                                                                                                        |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Windows | Secrets：Base64 PFX `WINDOWS_CERTIFICATE`、`WINDOWS_CERTIFICATE_PASSWORD`；变量：`WINDOWS_TIMESTAMP_URL`                            |
| macOS   | Secrets：`APPLE_CERTIFICATE`、`APPLE_CERTIFICATE_PASSWORD`、`APPLE_SIGNING_IDENTITY`、`APPLE_ID`、`APPLE_PASSWORD`、`APPLE_TEAM_ID` |

不提供系统凭据时仍能生成验收包，不能称为已完成系统签名或 Apple 公证。Windows runner 在任务结束时清理导入的证书。渠道要求见 [Windows 签名](https://v2.tauri.app/distribute/sign/windows/) 和 [macOS 签名](https://v2.tauri.app/distribute/sign/macos/)。

### 验证与排障

`node scripts/update-e2e.mjs` 使用临时测试密钥和独立 Test 应用，在 Windows NSIS、macOS app、Linux AppImage 中验证下载失败、篡改拒绝以及 0.1.0 → 0.1.1 安装重启；结束后卸载并清理。Linux 使用 xvfb-run。即使项目采用 basic 发布，CI 仍验证签名更新机制；测试不会使用正式私钥。

Linux 正式更新清单分别提供 AppImage 与 deb 签名条目；deb 更新可能要求系统授权，AppImage 所在目录需可写。

| 问题                | 处理                                                                          |
| ------------------- | ----------------------------------------------------------------------------- |
| 仓库身份不匹配      | 检查 origin，再运行 project:init；仓库改名时优先使用已登录 gh 获取稳定仓库 ID |
| 首次发布失败        | 标签版本与 package.json 一致，标签提交已进入默认分支，Actions 已启用          |
| 缺少更新密钥        | 普通项目使用 basic；已发行 updater 项目恢复原备份并配置 Secrets               |
| 无法自动创建同步 PR | 下载 upstream-diff 手动审查，或由维护者授权开启相应仓库选项                   |
| 客户端无法检查更新  | 检查更新地址、公钥和 Release 可见性，草稿或私有资产不能匿名更新               |
| 服务连接失败        | 检查 HTTPS 证书、health 接口与来源白名单                                      |

客户端回退通过安装经确认的旧版本完成；服务端迁移仍需按部署章节备份和恢复，客户端回退不会回退数据库。
