# 启动与验证

以下命令在业务项目根目录执行。先读取该检出的 package.json 与 README.development.md（旧版没有详解时查该版 README 和脚本）；不要在全局 skill 安装目录执行。

## 新项目

```sh
git clone https://github.com/DarkWinoom/vue3-laravel-admin.git my-admin
cd my-admin
git rev-parse HEAD
```

`my-admin` 仅是示例目标名；目录非空时不覆盖。用户指定了分支/tag/commit 时按其选择；已有定制仓库不自动 `git pull`，也不替换 origin。保留 LICENSE、frontend/LICENSE、upstream.json。

## 本地开发（界面与业务联调）

准备 Node 22.19+、pnpm 11、PHP 8.4、Composer、MySQL；准确版本以锁文件和当前 README.development.md 为准。

```sh
pnpm install --frozen-lockfile
pnpm run setup
pnpm install:local
# 在根 .env.development 中配置自己的 MySQL 连接
pnpm db:migrate
pnpm admin:create admin@example.com
pnpm dev
```

`setup` 只生成缺失 env，不覆盖已有配置；管理员密码通过交互输入，不放进 Git 或命令行参数。已有管理员时不重新初始化。默认开发页面 9527、API 8000，端口以根 env 为准。不要停止使用者已启动的服务；需要另一实例时选择独立端口。

## Docker（体验、部署与联调替代）

Docker 路径不要求宿主机安装 PHP/MySQL，也不要求先安装前端依赖；Git、Node 与 Docker Compose 即可。

```sh
node scripts/docker.mjs up
docker compose --env-file .env.testing exec api php artisan admin:create admin@example.com
```

默认页面 `http://localhost:8080`。`node scripts/docker.mjs update` 用当前工作区源码重建并迁移，`down` 停止服务且保留数据卷。不要为应用更新删除数据卷。

生产使用 `node scripts/docker.mjs up production` / `update production`。先执行 `node scripts/setup.mjs`、填写 `.env.production` 的访问地址和部署设置，公开访问通过 HTTPS；保持已有 APP_KEY、JWT_SECRET 与数据库凭据。首次生产管理员命令改用 `.env.production`。没有真实目标环境时只完成本地可验证工作，不把本地构建写成生产部署成功。

## 验证矩阵

| 改动                     | 执行                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| Vue/TypeScript/组件/导航 | `pnpm typecheck`、`pnpm lint`，界面操作及相关主题/视口检查，`pnpm build:web` |
| PHP/API/权限/事务        | `pnpm check:backend`、`pnpm test`，数据库相关改动再跑 `pnpm test:mysql`      |
| API 输入或输出           | `pnpm api:generate`、`pnpm api:check`，核对实际 HTTP 响应                    |
| 动态图标                 | `pnpm icons:generate`，验证图标显示且无外部图标请求                          |
| 完整功能节点             | `pnpm check` 和相关测试；不要为纯文字/样式小改重跑全部数据库流程             |

`pnpm test` 包含 Node 测试及 SQLite；`pnpm test:mysql` 会重建专用 `_testing` 库，绝不能指向开发/生产库。需要浏览器测试时运行 `pnpm test:seed` 后 `pnpm dev:test`，默认 9531/8011。专用测试账户 `browser-admin@example.test`、`browser-viewer@example.test`，密码均为 `Browser-test-password!`；它们不属于正式部署。MySQL 回归后重新 seed 以恢复验收账户。

`pnpm api:generate` / `pnpm api:check` 使用临时 SQLite 迁移库导出契约，无需外部 MySQL；数据库行为仍由 `pnpm test:mysql` 验证。

错误/越权测试应证明当前功能被拒绝，而不是仅断言页面上没有按钮。只标记真正执行成功的检查；依赖、网络或目标平台不足时明确记录影响，不添加空测试来替代验证。
