# Vue3 Laravel Admin

一个可以部署后直接使用、也可以通过 AI 定制的开源管理后台。已提供登录、用户与角色管理、菜单权限、个人中心、操作审计、统计仪表盘和接口文档，界面支持中文、明暗主题与手机访问。

你可以先部署体验，也可以先安装开发 skill，让 AI 以本项目为地基做出自己的管理系统。

## 部署并登录

准备 **Git、Node.js 22.19+ 和 Docker Compose**，启动 Docker 后执行：

```sh
git clone https://github.com/DarkWinoom/vue3-laravel-admin.git my-admin
cd my-admin
node scripts/docker.mjs up
```

首次构建需要下载依赖。启动完成后打开 **http://localhost:8080**；部署在服务器上时，将 localhost 换成服务器地址。

创建自己的管理员（邮箱可替换，密码按提示输入）：

```sh
docker compose --env-file .env.testing exec api php artisan admin:create admin@example.com
```

使用刚才设置的邮箱和密码登录。部署环境没有通用默认密码，已有管理员时无需重复创建。

这是默认体验环境。正式上线前需要配置实际访问地址和 HTTPS，具体操作见 [正式部署说明](README.development.md#正式部署与日常维护)。也可以在 AI 中要求下方的 skill 根据你的服务器准备部署方案。

## 通过 skill 定制功能

Skill 是给 AI 编程助手使用的项目开发指引。它会引导 AI 复用现有界面，并同步处理功能所需的菜单、权限、数据接口和检查。

以 Codex 为例，执行一次全局安装；不需要事先下载本项目：

```sh
npx skills add DarkWinoom/vue3-laravel-admin --skill vue3-laravel-admin --agent codex --global --copy
```

安装后，在支持 Agent Skills 的编程助手中新开会话，选择工作目录并描述需求。

**从零开始：**

> 使用 $vue3-laravel-admin，在 ./my-admin 创建一个商品管理后台。先拉取本项目作为地基。商品需要名称、分类、价格和启用状态，管理员可维护，普通员工只能查看。完成后告诉我如何启动和验收。

**在已部署项目上继续定制：**

> 使用 $vue3-laravel-admin，在当前项目增加客户管理，支持按姓名和状态筛选、查看详情和编辑。沿用现有界面风格，补齐菜单、权限与接口，并完成相关检查。

工作目录应是项目源码所在目录。AI 修改的是源码；功能完成后，在该目录执行下面的命令，让默认 Docker 环境使用新版本：

```sh
node scripts/docker.mjs update
```

更新使用当前目录中的代码并保留数据卷。生产环境更新、数据备份等操作见开发详解。

已克隆仓库的用户也可让 AI 直接读取仓库内的 skill。其他助手、本地安装、更新与移除方法见 [Skill 安装和使用规范](README.development.md#skill-安装和使用规范)。Skill 本身不运行业务系统，也不会代替 AI 编程助手或部署环境。

## 桌面使用

桌面客户端与网页版连接同一套服务。安装后首次打开，填写自己的 HTTPS 服务地址，再使用已有账号登录。“连接与更新”可更换服务和检查新版；重开应用需要重新登录。

桌面版支持 Windows、macOS 和 Linux，可用安装包以 [Releases](https://github.com/DarkWinoom/vue3-laravel-admin/releases) 中公开的版本为准。构建及维护细节见 [桌面开发说明](README.development.md#桌面客户端与构建)。

## 可选扩展阅读

[开发与部署详解](README.development.md)面向希望了解代码和命令的使用者，包含本地开发、环境配置、数据库与测试、模块扩展、技能维护以及部署排障。

项目采用 [MIT 许可证](LICENSE)，界面基于 [Soybean Admin](https://github.com/soybeanjs/soybean-admin)，保留上游许可证与资源来源。
