# 界面与导航

## 可复用入口

| 需求                       | 优先参考                                                                           |
| -------------------------- | ---------------------------------------------------------------------------------- |
| 管理列表、搜索、分页、编辑 | `frontend/src/components/management/`、`frontend/src/hooks/common/table.ts`        |
| 只读列表、过滤、详情       | `frontend/src/components/audit/`                                                   |
| 统计卡、图表、最近活动     | `frontend/src/components/dashboard/`、`frontend/src/hooks/common/echarts.ts`       |
| 表单与操作区布局           | `frontend/src/components/profile/`                                                 |
| 表格刷新及列设置           | `frontend/src/components/advanced/table-header-operation.vue`                      |
| 请求与会话                 | `frontend/src/service/request/`                                                    |
| 主题、字体、布局           | `frontend/src/theme/`、`frontend/src/store/modules/theme/`、`frontend/src/styles/` |

现有管理组件服务于核心资源，不要把新业务强塞进 `Resource` 联合与越来越大的 switch。复用通用表格、查询卡、抽屉、分页 hooks，新业务放 `components/<feature>/`，路由入口放 `views/<group>/<page>/index.vue`。Composition API + `<script setup lang="ts">`，沿用项目 kebab-case 文件名。

新需求没有直接可用示例时，先在公开 `upstream.json` 所记录的 Soybean `example` commit 查找对应源码；已有本地实现优先。不要追随上游最新 HEAD 自动升级本项目。许可证随复用资源保留。

## 新页面的连接清单

以“商品管理”为示意，标识取决于实际业务，不直接复制这些示例值：

1. 新建薄路由 `views/catalog/product/index.vue` 和功能组件。Vite/Elegant Router 生成 `catalog_product`；不要手改 `router/elegant/` 和自动生成的路由/组件类型。保持 `layoutLazyImport` 与 `store/modules/route/registry.ts` 的常量/授权路由分离。
2. 后端 `MenuQuery::VIEWS` 注册组件键，如 `products => catalog_product`。MenuRequest 从此映射验证组件键，无需另添白名单。
3. 在 `components/management/menu-operate-modal.vue` 的页面选项中加入中文标签与相同组件键。在中文路由文案中补齐生成路由所需标签。路由存在判断从生成表取得，无需维护另一份名称列表。
4. 通过新增迁移/应用入口创建菜单记录与所需权限；已有数据库也能迁移，不只修改首次初始化逻辑。`DefaultMenus` 默认安装在固定的 manage 目录；新业务目录不能仅把另一组路径塞进其 ITEMS。按真实父级初始化菜单，并验证首次安装和已有库升级都能出现入口，不修改历史迁移。
5. 默认两层：目录名不含下划线；子页名为 `目录名_页面名`，路径以目录路径加 `/` 开头。目录使用 `group`，页面使用已注册组件键，设置合适本地图标与读取权限。当前菜单校验针对静态路径，详情优先使用抽屉；需求必须使用参数路由时需同步扩展校验与匹配逻辑。
6. 使用真实 API。显示/操作权限来自 auth store 的 buttons，但后端仍需逐请求验证。只读工具栏设置 `show-actions=false`，授权的自定义操作放插槽，避免空插槽回退出新增/删除按钮。

## 样式与交互

- 使用 Naive UI、UnoCSS 和 scoped SCSS；已有全局样式按原作用域保留。查询卡、表格工具栏、抽屉和弹窗遵循官方风格。
- 图标从本地打包集合选取；代码增加动态标识后运行 `pnpm icons:generate`，未知图标使用本地占位。系统字体栈，无运行时 CDN。
- 所有可见文字至少 14px，包括计数器、标签、tooltip、分页、错误消息与 ECharts。检查明暗主题及窄内容区。
- Naive 24 列栅格的列间距会累加，窄容器避免过大 x-gap；查询布局参考 `responsive="self"`（使用 `600:12` 这样的数字断点，s/m 等命名断点用于 screen 模式），表格保留可操作的最小高度，抽屉限制最大视口宽度。
- 保持已有 profile 单栏满高、独立内容滚动、居中操作区；有标题/副标题的卡片沿用图标与双行文字的高度关系。用户明确要求的界面变化优先。
- 覆盖加载、空态、校验错误、服务错误及重复点击；不让多个组件各自保存同一套服务器数据。
