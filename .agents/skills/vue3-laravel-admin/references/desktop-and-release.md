# 桌面、CI 与发布（按需）

普通业务定制不需要配置发布凭据。涉及桌面、构建、发布或上游同步时使用本指南；命令均在业务仓库根目录执行。

## 项目身份与初始化

- 先检查 origin、desktop.json 和根 package.json。当前仓库与 desktop.json.repository 不匹配时，不沿用基座的应用身份或更新源。
- 为用户自己的 GitHub 项目发布时，确认实际目标仓库，安装根依赖后运行 `pnpm project:init --name "应用名称"`。它不会创建远端仓库或推送代码。不要把“获取基座”的来源误当成用户的发布目的地，也不擅自替换已有业务仓库的 origin。
- 新派生应用默认 basic，生成独立 identifier/binaryName，并清除继承的公钥、端点覆盖与发布环境。重复初始化保留同一应用身份；已经发行的应用不能随意重置标识或密钥。
- 可用的已登录 gh 会查询稳定仓库 ID；仓库改名时优先用此方式保留原身份。离线用 `--offline`；显式目标用 `--repository owner/repo`，仍需核对 origin。仅按仓库名称绑定的旧配置在改名后应人工核对，避免误建新应用。
- desktop.json 管理名称、标识、发布模式、公开更新密钥与可选端点/环境。根 package.json.version 为唯一版本来源，使用 `pnpm project:version <版本>` 同步 Tauri/Cargo/锁文件并提交。初始化和版本命令需要根 pnpm 依赖。
- 仓库与默认分支自动识别；空 updateEndpoint 使用当前仓库的最新公开 Release。已安装客户端保留构建时的地址，仓库改名需要迁移更新入口。保留原许可证、upstream.json 和第三方版本固定信息。

## 桌面边界与检查

桌面复用 Web 业务和 Laravel API，不包含 PHP/MySQL。components/desktop 提供界面，connection.ts 管理非敏感服务地址；令牌保持内存，不写本地文件或 localStorage。生产 API 为 HTTPS origin，可为空以首次配置；开发/测试只额外允许本机 HTTP。换服务需清理旧身份，后端来源白名单同步。

使用根 scripts/desktop.mjs 构建，不绕过模式、CSP 和签名校验。最小窗口 360×560；检查缩放、滚动和按钮可达。capabilities 仅按需求授权，不增加通用 shell、任意文件访问或远端窗口权限。

```sh
pnpm dev:desktop
pnpm build:desktop
pnpm check:desktop
node scripts/desktop.mjs build --mode testing --api http://127.0.0.1:8021 --debug --no-bundle --features desktop-e2e
pnpm test:desktop
node scripts/update-e2e.mjs
```

工具链以 rust-toolchain.toml、锁文件及 .github/actions/setup/action.yml 为准。原生测试使用独立 SQLite 临时库；8021/4445 被占用时停止本次测试，不杀死用户服务。Test 应用使用 .e2e 标识；带 WebDriver 的调试包不得分发。Linux 使用 xvfb-run。

checks.yml 同时供 CI 和 Release 调用，包含 Web/API/MySQL、三平台原生业务、临时密钥升级、生产包安装启动及卸载。Quality and desktop 手动运行的 portability 选项在临时 runner 中替换为独立派生应用，验证 basic、独立名称和二进制路径；此模式产物只用于验收。跨平台结论必须来自对应 runner，不能将 Windows 本机通过称为三平台通过。

## 发布与密钥

- basic：无更新 Secrets 也可发布三平台安装包、校验和及许可清单；不生成 latest.json，客户端关闭在线更新。
- updater：需要稳定的私钥和公钥；缺失时停止签名发布，不静默降级。第一次启用时，安装前端依赖后运行 `pnpm project:init --updater`。它保存公开配置和忽略目录 .release-keys 中的备份；提醒用户另存安全备份。重复执行复用，已启用却丢失备份时不轮换密钥。
- 私钥放 TAURI*SIGNING_PRIVATE_KEY Secret，有密码时另配 TAURI_SIGNING_PRIVATE_KEY_PASSWORD。公开配置支持 updaterPublicKey，历史 DESKTOP_UPDATER_PUBLIC_KEY Secret 也可用，但两者不能冲突。私钥和密码不进入 Git、VITE*\*、客户端或日志。
- 用户明确授权上传时可使用 `pnpm project:init --updater --upload-secrets`，通过已登录 gh 写入当前仓库或指定环境。该命令管理无密码密钥；已有加密密钥按手动 Secrets 流程维护。不因一般界面开发或安装 skill 自动创建私钥、上传 Secrets 或修改仓库权限。
- releaseEnvironment 留空表示不使用环境；填写名称不等于设置了保护规则。保留现有保护；需要更改管理员权限或保护规则时取得对应授权。
- 推送和发布沿用用户已有授权。准备版本后，将源码提交推送到默认分支，再推送匹配的 v\* 标签；手动 Release 从默认分支选择已有标签。发布验证准确标签和祖先关系，再对目标源码运行完整检查，不依赖历史 CI。
- release.yml 只创建/更新草稿。发现已公开版本或草稿额外附件时停止覆盖，不能自动删除用户附件。验收安装、服务连接与签名升级后再公开。
- 私有仓库的安装包/更新不能匿名下载；需要公开分发渠道或带认证的更新服务，不能将 GitHub token 放入客户端。系统签名和 Apple 公证另需有效凭据，不能将 updater 签名称为系统公证。

## 上游同步与说明

Dependabot 为两个 pnpm workspace、Composer、Cargo、Actions 提 PR。upstream:check 对比 upstream.json 固定 SHA；上游仓库是依赖来源，不替换为当前发布仓库。同步仅保存补丁和候选，不应用代码或推进基线；人工选择性移植、处理冲突并验证后更新基线。

上游 PR 自动以当前默认分支为目标。仓库未开启 GitHub 的 “Allow GitHub Actions to create and approve pull requests” 等权限时，保留 upstream-diff 供手动审查；不影响普通构建和 Release。更改此管理开关需对应授权，本工作流只创建草稿，不审批或合并。

文档同步：README.md 的“桌面使用 → 发布自己的桌面应用”放普通用户步骤和 skill 示例；README.development.md 的“在自己的 GitHub 仓库发布”及“签名更新与系统签名”放命令、配置和排障。不要把维护者内部记录作为使用者的必要阅读。
