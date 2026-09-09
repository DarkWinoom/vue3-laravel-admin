# 桌面、CI 与发布（按需）

仅当需求涉及桌面、构建、发布或上游同步时读取。普通业务定制继续使用界面与后端指南。

## 桌面边界

- 桌面复用 Web 业务和 Laravel API，不包含 PHP/MySQL。界面入口是 components/desktop，connection.ts 管理非敏感服务地址；令牌保持内存，不为免登录写入本地文件或 localStorage。
- desktop.json 管理名称、标识和更新端点，根 package.json.version 是桌面版本来源。派生应用修改独立标识及更新源，保留原许可证；不要让定制应用接收基座原版更新。
- 使用根 scripts/desktop.mjs 构建，避免绕过模式、CSP 和签名校验。生产地址为 HTTPS origin，可为空以首次配置；开发/测试只额外允许本机 HTTP。更换服务必须清理原身份，前后端来源设置同步。
- 默认窗口最小 360×560。检查缩放、表单滚动和按钮可达性，保持 Web 行为。capabilities 按需要授权，不添加通用 shell、任意文件访问或放开远端窗口权限。

## 检查与构建

```sh
pnpm dev:desktop
pnpm build:desktop
pnpm check:desktop
node scripts/desktop.mjs build --mode testing --api http://127.0.0.1:8021 --debug --no-bundle --features desktop-e2e
pnpm test:desktop
node scripts/update-e2e.mjs
```

在业务仓库根目录执行；依赖以 rust-toolchain.toml、锁文件及 .github/actions/setup/action.yml 为准。原生测试启动独立 SQLite 临时库；8021/4445 被占用时停止本次测试，不能杀死用户服务。测试应用以 .e2e 标识隔离，带 WebDriver 的调试包不能分发。Linux 测试使用 xvfb-run。

CI 的 quality 验证 Web/API，desktop 三个平台分别跑原生业务、签名升级、生产包安装启动及卸载测试。修改业务后按相关性选择测试；跨平台结论必须来自对应 runner，不能把 Windows 本机通过称为全平台通过。产物及截图由 Actions 保存。

## 更新与发布

更新交互在 use-desktop-update.ts，官方 updater 执行下载和签名校验；检查/下载/待重启期间限制冲突操作，异步结束释放资源，失败可重试。Windows 安装会退出应用，macOS/Linux 需要重启。

签名私钥只由进程环境或 Actions Secrets 注入；VITE\_\*、Git 和客户端只能含公开值。维护者备份更新密钥，缺失时停止签名发布，继续普通构建。系统代码签名和 Apple 公证需要另行提供有效凭据，不把 updater 签名当作系统公证。

release.yml 只聚合完整平台产物并建立草稿；公开发布应在实际安装和签名升级验收之后。派生仓库先核对自己的远端、GitHub 权限、密钥及目标版本；当前任务没有发布需求时不创建 Release 或配置私钥。

## 依赖与上游

Dependabot 为两个 pnpm workspace、Composer、Cargo、Actions 提 PR。upstream:check 对比 upstream.json 固定 SHA；上游工作流保存补丁并提出候选，不应用代码或推进基线。审查差异、选择性移植、解决冲突并验证后更新基线。保留本地模块、中文导航、SCSS 和用户定制样式。
