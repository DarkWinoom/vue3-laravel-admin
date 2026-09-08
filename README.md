# Vue3 Laravel Admin

Vue3 + Laravel 13 + MySQL 8，界面基于 soybean-admin Tauri 分支。

日常开发使用 `pnpm dev`；Docker 仅用于特定功能验证、部署测试或实际运行。

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

## 本地联调

本机准备 Node 22.19+、pnpm 11、PHP 8.4、Composer 和 MySQL，根目录运行：

```sh
pnpm install
pnpm run setup       # 仅生成缺失的根 env，不覆盖已有配置
pnpm install:local   # 安装前后端依赖
pnpm db:migrate
pnpm dev             # 同时启动前端 9527 与 API 8000；Ctrl+C 一起停止
```

| 命令                            | 用途                                        |
| ------------------------------- | ------------------------------------------- |
| `pnpm dev:desktop`              | Tauri 与 API 联调，需本机 Rust/Tauri 工具链 |
| `pnpm test` / `pnpm test:mysql` | 内存测试 / 独立 MySQL 测试库                |
| `pnpm check`                    | 类型、格式、静态检查                        |
| `pnpm fmt`                      | 格式化前端和脚本                            |
| `pnpm build:web`                | 生产模式 Web 构建                           |

## 配置

所有实际 env 均在根目录且不提交 Git，子目录仅保留独立运行用的 `.env.example`。

| 文件               | 配置内容                               |
| ------------------ | -------------------------------------- |
| `.env`             | 前端公共设置，如标题、主题相关变量     |
| `.env.development` | 本地开发：`DB_*`、前后端端口、应用密钥 |
| `.env.testing`     | 测试库、Docker 测试端口和密钥          |
| `.env.production`  | 生产地址、Docker 端口和密钥            |

本地连接使用 `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD`；Docker 内数据库地址和账号由 Compose 设置，使用 `DOCKER_DB_PASSWORD` 和 `MYSQL_ROOT_PASSWORD`。`DOCKER_HTTP_PORT` 控制容器对外端口，`APP_URL` 设置访问地址。`VITE_*` 属于前端公开配置，不能放数据库密码或服务端密钥，修改后需重新构建。

## 注意

- 当前完成工程基线，业务登录尚未实现；登录请求返回 **404 属于当前阶段预期**。联通检查使用 `/api/v1/health`。
- 本地 MySQL 测试库名称必须以 `_testing` 结尾；测试会刷新该库的表。
- 已有数据卷不要随意修改数据库密码或删除密钥；正式更新前备份数据库。
- VS Code 从根目录打开并安装推荐扩展。提交前自动执行检查，commit 标题使用英文。
- 上游来源见 `upstream.json`，保留 `frontend/LICENSE`；项目采用 MIT。
