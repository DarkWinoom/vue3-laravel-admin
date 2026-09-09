# 后端、权限与契约

## 模块边界

Laravel 模块在 `backend/app/Modules/`。新业务选择自己的模块，控制器处理 HTTP 输入/输出，应用 Commands 负责写入事务，Query 返回查询结果；不为每张表添加无用途 repository，也不引入新的事件总线。

参考：`Identity/Application/UserCommands.php`、`Navigation/Application/MenuCommands.php`、`Audit/Application/AuditQuery.php`、`Dashboard/Application/DashboardQuery.php`。分页、搜索、排序字段必须有限制；数据库迁移考虑已有数据，不能修改已发布历史迁移来实现升级。

## 权限与一致性

- 使用现有 `AuthenticateSession` 保护路由，在应用入口调用 `AccessCommands::authorize` 或既有授权查询。新权限沿用 `资源.操作` 命名。
- 角色、权限、用户角色分配通过 `AccessCommands` 与 AccessAggregate 事件保存；事件和同步投影同事务，禁止直接写 `roles`、`permissions` 及其授权关联表。
- 安装新模块时，用新增迁移中的应用入口创建权限并处理目标角色授予。参考现有增量权限迁移；不要在每次 HTTP 请求中补权限。固定业务模块的权限纳入 `builtInPermissions()`，让首次 admin:create 也能生成；增量迁移负责给已有库补齐。核对新库与升级两条路径，不要只复制“没有管理员就返回”的迁移。权限树中文分组在角色抽屉中维护；未指定的普通角色不自动扩大权限。
- 现有核心管理写入使用 access_state.version 并在同事务内加锁、校验权限和持久化；冲突返回 409。新业务如需并发控制，在自己的模型设计版本/锁，不把所有业务竞争都塞入全局授权锁。
- 保留最后一个可用管理员、越权授予/修改保护、即时撤权、禁用/改密撤销会话、重放幂等和 created_at 保持不变等已测行为。权限重放只重建授权投影，不重做审计或外部副作用。
- 新写操作通过 AuditRecorder 在成功事务内记录；失败由现有异常处理记录。白名单不包含密码、邮箱、令牌、Cookie 和请求正文。需要新业务字段时明确选择必要字段并测试脱敏，不能把完整请求作为 details 透传。

## API 与生成类型

- 在 `backend/routes/api.php` 接入 `/api/v1`。成功用 `Api::ok`，错误保留 HTTP 状态及业务 code；health 是现有原始健康响应例外。
- 核心管理分页 `{records,total,page,pageSize,version}`；审计无 version。新业务声明实际分页/版本契约，不假定所有列表形状相同，每页最多 100 条。
- FormRequest 同时承担验证与授权。Web/desktop 登录刷新契约不同：Web 使用 Cookie 和 CSRF，desktop 在刷新请求中携带 refreshToken。复用现有客户端适配器，不另写 token/refresh 缓存。
- Scramble 自动识别路由和输入；事务返回模型由 `Documentation/Application/ApiDocument.php` 显式补充。**该转换器会拒绝未登记的 GET 响应契约**：新增接口须同步定义/选择响应 schema，不能用默认空对象蒙混通过。
- 运行 `pnpm api:generate` 后提交 `backend/openapi.json` 和 `frontend/src/service/api/openapi.d.ts`，前端引用生成类型；`pnpm api:check` 核对漂移。必要时扩展真实 HTTP 响应/条件输入契约测试。
- API 文档仅 `docs.read` 可读，生产默认关闭；普通业务定制不自动打开生产文档或修改认证边界。

纯界面定制可不变动以上模块。新功能确实需要改变既有边界时，先说明影响并按用户意图实现，不把默认范围扩张成多租户、支付或工作流系统。
