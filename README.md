# Vue3 Laravel Admin

基于 soybean-admin Tauri 分支的 Web 与桌面管理系统，后端为 Laravel 13，数据库为 MySQL 8。

当前完成工程基线与联调环境。界面仍为上游模板，业务登录、权限页面、审计与桌面发布按后续阶段实施。

## 环境

- Node.js 22.19+（推荐 24 LTS）、pnpm 11.5.0。
- PHP 8.4、Composer 2；启用 mbstring、openssl、pdo_mysql、pdo_sqlite、xml、curl、fileinfo、zip 等 Laravel/测试所需扩展。
- MySQL 8，分别创建开发数据库和测试数据库；测试数据库名称必须以 `_testing` 结尾。
- 桌面开发额外安装 Rust stable 和 Tauri 对应平台构建依赖。Windows 需要 MSVC C++ Build Tools 与 WebView2；macOS 需要 Xcode 工具；Linux 需要 WebKitGTK 等系统库。参见 [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)。

## 从根目录开发

```sh
pnpm install --frozen-lockfile
pnpm run setup
```

setup 安装前后端锁定依赖，生成以下本地配置；已有文件保留，不自动执行数据库迁移。后端新配置自动生成 APP_KEY 和 JWT_SECRET。

| 文件                              | 用途                                   |
| --------------------------------- | -------------------------------------- |
| `.env.development.local`          | 前后端监听地址及端口                   |
| `frontend/.env.development.local` | 前端开发模式变量                       |
| `backend/.env.development`        | MySQL 连接、Laravel 密钥和后端服务配置 |

修改后端配置中的 `DB_HOST`、`DB_PORT`、`DB_DATABASE`、`DB_USERNAME`、`DB_PASSWORD`，连接已创建的开发数据库，然后在根目录执行：

```sh
pnpm db:migrate
pnpm dev
```

默认前端为 `http://127.0.0.1:9527`，API 为 `http://127.0.0.1:8000`。根 env 可覆盖端口，脚本同步设置 API 地址和 Vite 代理目标。健康检查为 `/api/v1/health`；前端代理路径为 `/proxy-default/api/v1/health`。按 Ctrl+C 统一关闭两个服务。

桌面联调使用 `pnpm dev:desktop`：启动 API 与 Tauri，Tauri 启动同一 Vite 开发服务。桌面客户端连接 API，不内嵌 PHP 或 MySQL。

真实 env 不提交。前端 `VITE_*` 可进入浏览器包，只放公开配置。开发后端显式加载 `--env=development` 并隔离配置缓存；测试使用独立环境。生产不得使用开发 env，Web 构建使用前端 `prod` 模式。

## 检查与构建

```sh
pnpm doctor --database
pnpm doctor --desktop
pnpm check
pnpm test
pnpm build:web
```

`doctor` 检查本机命令与 PHP 扩展；`--database` 检查开发 MySQL 连接，`--desktop` 检查 Tauri 原生工具链。

`check` 执行 Vue 类型检查、上游 ESLint/oxlint、Prettier、Pint 和 Larastan。`test` 执行联调配置测试以及基于内存 SQLite 的 Laravel 健康接口、JWT/RBAC/事件重放兼容测试。格式修复使用 `pnpm fmt`，PHP 格式修复在 backend 目录运行 `php vendor/bin/pint`。

MySQL 集成测试：复制 `backend/.env.testing.example` 为 `backend/.env.testing`，填写专用测试数据库，再运行 `pnpm test:mysql`。该命令会迁移和刷新测试表，只连接名称以 `_testing` 结尾的测试库。

Web 输出位于 `frontend/dist`。`pnpm build:desktop` 调用上游 Tauri 构建，需要对应平台原生工具链。三平台发布与自动更新将在后续阶段交付。

## 工程结构与二次开发

- `frontend/`：上游完整 pnpm workspace；保留 `packages/`、路由、Naive UI、主题与 Tauri。
- `backend/`：Laravel API；当前提供健康接口及包兼容性测试。
- `scripts/`：根目录联调、环境配置、检查与提交校验。
- `upstream.json`：导入来源、固定 commit 与本地差异。

前端使用 `<script setup lang="ts">`，遵循 [Soybean 代码规范](https://docs.soybeanjs.cn/zh/standard/)。组件优先复用当前分支与固定 example 分支，核心依赖版本随上游基线整体维护。当前增加根 Prettier 格式化入口，前端安装不覆盖根 Git hooks。

VS Code 从仓库根目录打开并安装推荐扩展。Vue 使用 Vue Official，PHP 使用 Intelephense；先安装依赖，使语言服务可索引 backend/vendor 与前端生成类型。保留未定义符号诊断，不通过关闭检查隐藏 helpers 错误。自定义 PHP helper 如确实需要，应配置 Composer autoload.files 并声明类型。

simple-git-hooks 在提交前运行 `pnpm check`，提交标题使用英文 Conventional Commits，最多 72 字符，例如 `feat: add user management`。

## 上游与许可证

前端来源为 [soybean-admin](https://github.com/soybeanjs/soybean-admin)，基线 commit 为 `5326761c189d4dea1517fb836266f27710e5a815`。完整来源见 `upstream.json`，上游 MIT 许可证保留于 `frontend/LICENSE`。本项目采用 MIT；依赖遵守各自许可证。
