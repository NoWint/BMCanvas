# ModCanvas 生产化升级 — 子项目1：核心体验升级

**日期**: 2026-06-12
**状态**: 已批准
**策略**: 渐进增强（在现有代码基础上扩展功能，不重构架构）

---

## 设计语言：Apple TV 风格

遵循 Apple 的高级设计感，打造沉浸式深色体验。

### 核心原则

1. **沉浸式深色**：纯黑背景（#000000），内容浮于其上，如同 Apple TV 的影视浏览体验
2. **毛玻璃层叠**：面板、卡片、弹窗使用 `backdrop-filter: blur(40px)` + 半透明背景，营造深度感
3. **大字体排版**：标题 28-40px / 正文 14-16px / 辅助 12px，SF Pro 风格（使用 Inter 作为 web 替代）
4. **流畅动画**：所有交互 300ms ease-out 过渡，卡片 hover 微缩放（1.02x），面板滑入/淡入
5. **留白至上**：内容区域 padding 24-32px，卡片间距 16px，让视觉呼吸
6. **焦点引导**：选中/高亮元素使用微妙的光晕效果（box-shadow with accent color），而非粗边框

### 色彩系统

```
--bg-primary:       #000000     /* 纯黑背景 */
--bg-secondary:     #1c1c1e     /* 面板背景 */
--bg-elevated:      #2c2c2e     /* 卡片/弹窗背景 */
--bg-glass:         rgba(30,30,30,0.7)  /* 毛玻璃背景 */

--text-primary:     #f5f5f7     /* 主文字 */
--text-secondary:   #86868b     /* 辅助文字 */
--text-tertiary:    #48484a     /* 占位文字 */

--accent:           #0a84ff     /* 主强调色（蓝） */
--accent-green:     #30d158     /* 成功/添加 */
--accent-orange:    #ff9f0a     /* 警告 */
--accent-red:       #ff453a     /* 错误/删除 */
--accent-purple:    #bf5af2     /* 特殊标签 */

--border:           rgba(255,255,255,0.08)  /* 微妙边框 */
--divider:          rgba(255,255,255,0.12)  /* 分割线 */
```

### 组件风格

**卡片**：
- 圆角 16px
- 背景 `rgba(44,44,46,0.8)` + `backdrop-filter: blur(20px)`
- hover：`transform: scale(1.02)` + `box-shadow: 0 8px 32px rgba(0,0,0,0.4)`
- 过渡 300ms ease-out

**面板**：
- 圆角 12px（朝向画布的边）
- 背景 `rgba(28,28,30,0.85)` + `backdrop-filter: blur(40px)`
- 左侧面板 border-right: `1px solid rgba(255,255,255,0.08)`

**搜索面板**：
- 全屏浮层，背景 `rgba(0,0,0,0.85)` + `backdrop-filter: blur(60px)`
- 搜索框 48px 高度，圆角 12px，背景 `rgba(44,44,46,0.6)`
- 分类标签：pill 形状，选中态 `background: rgba(10,132,255,0.2)` + `border: 1px solid rgba(10,132,255,0.4)`

**图节点**：
- 圆角 12px
- 背景 `rgba(44,44,46,0.9)` + `backdrop-filter: blur(16px)`
- 选中：左侧色条 + 微妙光晕 `box-shadow: 0 0 20px rgba(10,132,255,0.15)`
- hover：`transform: scale(1.02)`

**按钮**：
- 主要按钮：`background: #0a84ff` + 圆角 8px + hover 变亮
- 次要按钮：`background: rgba(255,255,255,0.08)` + 圆角 8px
- 危险按钮：`background: #ff453a`
- 所有按钮 hover 有 1.02x 缩放

**Toast**：
- 圆角 12px
- 背景 `rgba(44,44,46,0.9)` + `backdrop-filter: blur(20px)`
- 左侧 3px 色条（绿/红/黄/蓝）
- 入场：从右侧滑入 + 淡入

**滚动条**：
- 自定义细滚动条：6px 宽，`rgba(255,255,255,0.15)`，hover 变亮

---

## 概述

将 ModCanvas 从演示版本升级为真正可用的产品。聚焦6大模块：
1. 模组发现与浏览系统（Apple TV 商店式体验）
2. 图谱交互增强（折叠/高亮/拖拽/右键菜单）
3. 中文 i18n 国际化
4. 错误处理（Toast + ErrorBoundary）
5. 布局与面板优化
6. 前后端类型同步 + 数据库迁移

---

## 1. 模组发现与浏览系统

### 1.1 当前问题

- 搜索面板只有一个搜索框+简单列表，浏览体验差
- 浏览器模式 mock 数据硬编码3个结果，搜索词不影响结果
- 没有分类浏览，用户无法发现新模组
- Modpacks 搜索依赖 `currentProject.mc_version`，无项目时受限

### 1.2 重设计方案

**搜索面板新布局**：

```
┌─────────────────────────────────────┐
│ 🔍 搜索模组...                       │  ← 搜索框（debounce 300ms 自动搜索）
├─────────────────────────────────────┤
│ [模组] [整合包]                       │  ← 主标签页
├─────────────────────────────────────┤
│ [热门] [最新] [性能] [冒险] [红石]     │  ← 分类标签（模组标签页下）
│ [魔法] [科技] [装饰] [食物] [世界]     │
├─────────────────────────────────────┤
│ ┌──────┐ ┌──────┐ ┌──────┐         │  ← 横向滚动卡片列表
│ │ 🧊   │ │ 🌈   │ │ ⚡   │         │
│ │Sodium │ │ Iris │ │Lithium│        │
│ │⬇ 1.2M │ │⬇ 800K│ │⬇ 600K│        │
│ │  [+]  │ │  [+] │ │  [+] │        │
│ └──────┘ └──────┘ └──────┘         │
│ ┌──────┐ ┌──────┐ ┌──────┐         │
│ │ ⚙️   │ │ 💾   │ │ 🔧   │         │
│ │Create │ │ AE2  │ │Mekanism│      │
│ │⬇ 900K │ │⬇ 500K│ │⬇ 450K │       │
│ │  [+]  │ │  [+] │ │  [+] │        │
│ └──────┘ └──────┘ └──────┘         │
├─────────────────────────────────────┤
│ 筛选：[MC版本 ▾] [加载器 ▾] [排序 ▾]  │  ← 筛选器（搜索结果模式显示）
├─────────────────────────────────────┤
│ 搜索结果列表（有搜索词时替代分类浏览）  │
│ 🧊 Sodium - 渲染优化     ⬇1.2M  [+] │
│ 🌈 Iris Shaders - 光影   ⬇800K  [+] │
│ ...                                 │
└─────────────────────────────────────┘
```

**分类标签页**（使用 Modrinth API 的 categories 参数）：

模组分类：
| 标签 | API category | 中文 |
|------|-------------|------|
| 热门 | 按 downloads 排序 | 热门 |
| 最新 | 按 updated 排序 | 最新 |
| 性能优化 | `optimization` | 性能优化 |
| 冒险 | `adventure` | 冒险 |
| 红石 | `redstone` | 红石 |
| 魔法 | `magic` | 魔法 |
| 科技 | `technology` | 科技 |
| 装饰 | `decoration` | 装饰 |
| 食物 | `food` | 食物 |
| 世界生成 | `worldgen` | 世界生成 |

整合包分类：
| 标签 | API category | 中文 |
|------|-------------|------|
| 热门 | 按 downloads 排序 | 热门 |
| 最新 | 按 updated 排序 | 最新 |
| 轻量 | `optimization` | 轻量 |
| 大型 | `technology` + `adventure` | 大型 |
| 多人 | `multiplayer` | 多人 |

**模组卡片设计**：

```
┌──────────────┐
│    [图标]     │   ← 64x64 模组图标，圆角
│              │
│   Sodium     │   ← 模组名称，粗体
│  渲染引擎优化  │   ← 简短描述，灰色
│  ⬇ 1.2M     │   ← 下载量
│ 1.21  Fabric │   ← MC版本 + 加载器标签
│    [➕ 添加]  │   ← 绿色添加按钮
└──────────────┘
```

卡片尺寸：160×200px，横向滚动，每行3-4个。

**搜索结果列表**（有搜索词时显示）：

每行：
- 左侧：图标(32x32) + 名称 + 简短描述
- 中间：下载量 + MC版本标签 + 加载器标签
- 右侧：添加按钮

**交互逻辑**：

- 无搜索词：显示分类浏览（默认"热门"标签页）
- 有搜索词：显示搜索结果列表 + 筛选器
- 输入时 debounce 300ms 自动搜索
- 搜索结果为空时显示"热门推荐"
- Modpacks 搜索不依赖当前项目版本
- 点击卡片/行项：打开 Inspector 显示详情

### 1.3 Rust 后端新增

- `search_mods_by_category(category: String, loaders: Vec<String>, game_versions: Vec<String>, page: i32)` — 按分类搜索
  - 使用 Modrinth API 的 `categories` 参数
  - `facets: [["category:{category}"], ["project_type:mod"]]`
- `search_modpacks_by_category(category: String, page: i32)` — 按分类搜索整合包

### 1.4 前端 mock 层改造

维护丰富的 mock 数据：
- 20+ 条模组数据（覆盖各分类）
- 10+ 条整合包数据
- 每条数据包含完整 `ModrinthSearchHit` 字段
- `search_mods` mock：按 query 模糊匹配 title/slug/description
- `search_mods_by_category` mock：按 category 过滤
- `get_mod_details` / `get_mod_versions`：完整详情

### 1.5 验收标准

- 打开搜索面板即看到热门模组卡片列表
- 切换分类标签页显示不同分类的模组
- 输入搜索词后显示搜索结果
- 浏览器模式和 Tauri 模式均可用
- 无项目时搜索正常工作

---

## 2. 图谱交互增强

### 2.1 当前问题

- 图谱只能看，不能交互（除了点击选中）
- 没有折叠/展开、路径高亮、拖拽、右键菜单
- `detectConflicts(mods, [], ...)` 传空依赖数组
- 添加 mod 后图不自动刷新

### 2.2 四大交互能力

#### 2.2.1 折叠/展开子树

**交互**：
- 双击节点：折叠/展开该节点的所有下游依赖
- 折叠状态：节点右下角显示 `+3 deps` 标记（表示有3个隐藏依赖）
- 折叠的边变为虚线，指向一个"折叠指示器"
- 折叠节点左下角显示 `▸` 图标，展开显示 `▾`

**实现**：
- `graphStore` 新增 `collapsedNodes: Set<string>`
- `buildGraph` 时检查 `collapsedNodes`，折叠的节点的下游依赖不生成节点和边
- 折叠节点添加 `+N deps` 数据到 `node.data`

#### 2.2.2 依赖路径高亮

**交互**：
- 单击节点：高亮该节点到所有根节点的路径
- 高亮效果：路径上的节点和边变为亮色，其他节点和边变为半透明（opacity 0.15）
- 再次单击同一节点取消高亮
- 按住 Shift+点击：追加高亮（多条路径同时高亮）
- 按 Escape 取消所有高亮

**实现**：
- `graphStore` 新增 `highlightedNodeIds: Set<string>`
- `GraphCanvas` 中根据 `highlightedNodeIds` 设置节点/边的 className
- CSS：`.dimmed { opacity: 0.15; transition: opacity 0.3s; }`
- 路径追溯算法：从选中节点沿边反向遍历到根节点

#### 2.2.3 手动拖拽布局

**交互**：
- 节点可自由拖拽（React Flow 默认支持）
- 拖拽后位置被记住，不被 `buildGraph` 重置
- 新增"重置布局"按钮：恢复 dagre 自动布局

**实现**：
- `graphStore` 新增 `pinnedPositions: Map<string, {x: number, y: number}>`
- `buildGraph` 时：已有 `pinnedPositions` 的节点使用保存的位置，新节点使用 dagre 计算
- 拖拽结束时更新 `pinnedPositions`
- "重置布局"按钮：清空 `pinnedPositions` 并重新 `buildGraph`

#### 2.2.4 右键上下文菜单

**菜单项**：
```
┌─────────────────────┐
│ 📋 查看详情          │  → 打开 Inspector 并选中该节点
│ 🔗 查看依赖链        │  → 高亮该节点的完整依赖路径
│ 🔄 替换模组          │  → 搜索同类模组（相同 categories）
│ ⬆️ 检查更新          │  → 调用 Modrinth API 检查新版本
│ 🗑️ 移除模组          │  → 从项目中移除
│ ─────────────────── │
│ 📌 固定位置          │  → 锁定节点位置不被自动布局重置
│ 🔽 折叠子树          │  → 折叠/展开子树
└─────────────────────┘
```

**实现**：
- 新增 `src/components/graph/ContextMenu.tsx`
- `graphStore` 新增 `contextMenu: { nodeId: string, x: number, y: number } | null`
- React Flow 的 `onNodeContextMenu` 事件设置 `contextMenu` 状态
- 点击菜单项执行对应操作
- 点击其他区域关闭菜单

### 2.3 依赖图修复

- `GraphCanvas` 中正确获取 `allDependencies` 并传给 `detectConflicts`
- `projectStore.addMod` / `removeMod` / `selectProject` 后自动调用 `graphStore.buildGraph()`
- `fetch_and_save_dependencies` 改为递归解析（深度2层，HashSet 去重）

### 2.4 验收标准

- 双击节点可折叠/展开子树
- 单击节点高亮依赖路径，其他节点变暗
- 节点可拖拽，位置不被自动布局重置
- 右键节点弹出上下文菜单，所有菜单项可用
- 添加/删除 mod 后图自动更新
- 冲突检测正确工作

---

## 3. 中文 i18n 国际化

### 3.1 技术选型

`react-i18next` + `i18next` + `i18next-browser-languagedetector`

### 3.2 文件结构

```
src/i18n/
  index.ts          — i18next 初始化配置
  zh-CN.json        — 中文（默认语言）
  en.json           — 英文
```

### 3.3 语言文件结构

按功能模块分组，覆盖所有界面文案。关键新增：

```json
{
  "search": {
    "placeholder": "搜索模组...",
    "modpacksPlaceholder": "搜索整合包...",
    "mods": "模组",
    "modpacks": "整合包",
    "categories": {
      "popular": "热门",
      "newest": "最新",
      "optimization": "性能优化",
      "adventure": "冒险",
      "redstone": "红石",
      "magic": "魔法",
      "technology": "科技",
      "decoration": "装饰",
      "food": "食物",
      "worldgen": "世界生成",
      "lightweight": "轻量",
      "large": "大型",
      "multiplayer": "多人"
    },
    "filters": {
      "mcVersion": "MC 版本",
      "loader": "加载器",
      "sortBy": "排序"
    },
    "downloads": "下载量",
    "add": "添加",
    "import": "导入",
    "noResults": "未找到结果",
    "browsePopular": "浏览热门",
    "selectProjectFirst": "请先选择项目",
    "contains": "包含 {{count}} 个模组"
  },
  "contextMenu": {
    "viewDetails": "查看详情",
    "viewDependencyChain": "查看依赖链",
    "replaceMod": "替换模组",
    "checkUpdate": "检查更新",
    "removeMod": "移除模组",
    "pinPosition": "固定位置",
    "collapseSubtree": "折叠子树",
    "expandSubtree": "展开子树"
  },
  "welcome": {
    "title": "ModCanvas",
    "subtitle": "可视化设计 Minecraft 模组整合包",
    "quickDemo": "快速体验",
    "demoMods": "4 个示例模组",
    "createNew": "新建项目",
    "blankModpack": "空白整合包",
    "importFile": "导入文件",
    "mrpackZip": ".mrpack / .zip",
    "trendingModpacks": "热门整合包",
    "recentProjects": "最近项目",
    "importing": "导入中...",
    "downloads": "下载量"
  },
  "graph": {
    "fitView": "适配视图",
    "zoomIn": "放大",
    "zoomOut": "缩小",
    "resetLayout": "重置布局",
    "collapseSubtree": "折叠子树",
    "expandSubtree": "展开子树",
    "deps": "{{count}} 个依赖"
  },
  "inspector": {
    "details": "详情",
    "versions": "版本",
    "dependencies": "依赖",
    "modDetails": "模组详情",
    "supportedVersions": "支持版本",
    "license": "许可证",
    "repository": "源码仓库",
    "homepage": "主页",
    "changelog": "更新日志",
    "noModSelected": "选择模组查看详情",
    "currentVersion": "当前版本",
    "switchVersion": "切换版本",
    "required": "必需",
    "optional": "可选"
  },
  "export": {
    "title": "导出整合包",
    "format": "导出格式",
    "modrinth": "Modrinth (.mrpack)",
    "curseforge": "CurseForge (.zip)",
    "prism": "Prism Launcher",
    "zip": "ZIP 压缩包",
    "exporting": "导出中...",
    "downloading": "正在下载 {{name}} ({{current}}/{{total}})...",
    "packing": "正在打包...",
    "success": "导出成功",
    "failed": "导出失败"
  },
  "diagnostics": {
    "title": "诊断报告",
    "critical": "严重",
    "warning": "警告",
    "info": "提示",
    "missingDependency": "缺失依赖",
    "versionMismatch": "版本不匹配",
    "loaderConflict": "加载器冲突",
    "knownIncompatibility": "已知不兼容",
    "duplicateFunctionality": "功能重复"
  },
  "modList": {
    "mods": "模组 ({{count}})",
    "addMod": "添加模组",
    "allProjects": "所有项目",
    "newProject": "新建项目",
    "removeMod": "移除模组",
    "searchMods": "搜索模组...",
    "batchDelete": "批量删除",
    "batchExport": "批量导出",
    "selected": "已选 {{count}} 项"
  },
  "statusBar": {
    "mods": "{{count}} 个模组",
    "deps": "{{count}} 个依赖",
    "crit": "{{count}} 个严重",
    "warn": "{{count}} 个警告",
    "loading": "正在加载...",
    "fetchingDeps": "正在获取依赖...",
    "exporting": "正在导出...",
    "ready": "就绪"
  },
  "common": {
    "cancel": "取消",
    "confirm": "确认",
    "delete": "删除",
    "edit": "编辑",
    "save": "保存",
    "close": "关闭",
    "required": "必需",
    "optional": "可选",
    "version": "版本",
    "loader": "加载器",
    "minecraftVersion": "MC 版本",
    "name": "名称",
    "description": "描述",
    "author": "作者",
    "loading": "加载中...",
    "retry": "重试",
    "error": "错误",
    "success": "成功"
  },
  "toast": {
    "modAdded": "已添加 {{name}}",
    "modRemoved": "已移除 {{name}}",
    "projectCreated": "项目已创建",
    "projectDeleted": "项目已删除",
    "importSuccess": "整合包导入成功",
    "importFailed": "导入失败：{{error}}",
    "exportSuccess": "导出成功：{{path}}",
    "exportFailed": "导出失败：{{error}}",
    "updateAvailable": "{{name}} 有新版本可用",
    "copiedToClipboard": "已复制到剪贴板"
  }
}
```

### 3.4 语言检测与切换

- `i18next-browser-languagedetector` 检测系统语言
- 默认中文（`zh-CN`）
- 检测到 `zh-*` 使用中文，其他使用英文
- StatusBar 右侧添加语言切换按钮（中/EN）
- 持久化到 localStorage

### 3.5 验收标准

- 所有界面文案默认显示中文
- 切换到英文后所有文案正确显示
- 无硬编码文案残留
- 分类标签页的中文映射正确

---

## 4. 错误处理

### 4.1 Toast 通知系统

新增 `src/stores/toastStore.ts`（Zustand）：
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // 默认 3000ms
}
```

新增 `src/components/common/ToastContainer.tsx`：
- 渲染在 App 最外层（z-50）
- 位置：右上角，堆叠显示
- 工业极简风格：深色背景 + 左侧色条（绿/红/黄/灰）+ 文字
- 自动消失（3秒），可手动关闭
- 入场动画：从右侧滑入

**projectStore 改造**：
- 所有 catch 块调用 `addToast(msg, 'error')`
- 成功操作也通知（添加 mod、删除项目等）

### 4.2 React ErrorBoundary

新增 `src/components/common/ErrorBoundary.tsx`：
- 包裹 App 内容
- 崩溃时显示简洁的错误页面（中文提示 + 重试按钮）

### 4.3 验收标准

- 操作失败时右上角显示红色 toast
- 操作成功时显示绿色 toast
- 组件崩溃时显示错误页面而非白屏

---

## 5. 布局与面板优化

### 5.1 ModListPanel 增强

- 模组列表支持**多选**（Ctrl+点击多选，Shift+点击范围选）
- 多选时底部出现批量操作栏（删除/导出）
- 模组项显示：图标(24x24) + 名称 + 版本号 + 类型标签（loader/api/mod）
- 搜索过滤：顶部添加搜索框过滤模组列表

### 5.2 InspectorPanel 增强

标签页式布局：`详情` | `版本` | `依赖`

**详情标签**：
- 图标(64x64) + 名称 + 作者
- 描述
- 许可证 + 主页 + 仓库（链接形式）
- MC 版本标签列表
- 加载器标签

**版本标签**：
- 版本列表，每行：版本号 + MC版本 + 发布日期 + 加载器
- 可点击切换版本
- 当前版本高亮

**依赖标签**：
- 该模组的所有依赖树（小型嵌套列表）
- 必需依赖（实线连接）/ 可选依赖（虚线连接）
- 每个依赖可点击跳转到对应节点

### 5.3 StatusBar 增强

- 左侧：模组数 + 依赖数 + 诊断数
- 中间：当前操作提示（如"正在获取依赖..."、"正在导出..."）
- 右侧：语言切换（中/EN）+ 重置布局按钮

### 5.4 验收标准

- 模组列表支持多选和批量操作
- Inspector 有3个标签页，内容完整
- StatusBar 显示操作状态和语言切换

---

## 6. 前后端类型同步 + 数据库迁移

### 6.1 问题

- Rust `ProjectMod` 缺少 `homepage_url`、`supported_mc_versions`、`changelog` 字段
- SQLite `project_mods` 表缺少对应列
- 前端 `addMod` 中 `homepage_url` 被错误赋值为 `details.license?.name`
- 没有 `update_project` 命令

### 6.2 修复方案

**Rust 类型补全**：

`ProjectMod` 和 `ModInput` 添加：
- `homepage_url: Option<String>`
- `supported_mc_versions: Option<Vec<String>>` — Rust 端用 Vec，存储时序列化为 JSON 字符串
- `changelog: Option<String>`

**IPC 类型转换**：
- `add_mod_to_project`：前端传入 `string[]`，Rust 接收 `Vec<String>`，存储时 `serde_json::to_string()` 序列化
- `list_project_mods`：Rust 读取 JSON 字符串，`serde_json::from_str()` 反序列化为 `Vec<String>` 返回前端

**SQLite 迁移**（`src-tauri/src/db/migrations.rs`）：

版本化迁移系统：
- 创建 `schema_version` 表记录当前版本
- V1→V2：`ALTER TABLE project_mods ADD COLUMN homepage_url TEXT DEFAULT ''`
- V2→V3：`ALTER TABLE project_mods ADD COLUMN supported_mc_versions TEXT DEFAULT '[]'`
- V3→V4：`ALTER TABLE project_mods ADD COLUMN changelog TEXT DEFAULT ''`
- 新字段都有默认值，保持向后兼容

**新增命令**：
- `update_project(id, name, description, mc_version, loader)` — 编辑项目元数据

**前端 bug 修复**：
- `projectStore.ts`：`homepage_url: details.license?.name` → `homepage_url: details.homepage_url`

### 6.3 验收标准

- 前端添加 mod 后，所有字段正确存储到 SQLite
- `list_project_mods` 返回完整字段
- 项目名称/版本可编辑
- 旧数据库自动迁移，不丢失数据

---

## 实施优先级

| 优先级 | 模块 | 原因 |
|--------|------|------|
| P0 | 错误处理（Toast） | 用户无法感知操作结果，所有后续功能依赖此 |
| P0 | 模组发现与浏览 | 最核心的用户功能 |
| P1 | 图谱交互增强 | 核心差异化功能 |
| P1 | 中文 i18n | 默认语言要求 |
| P1 | 布局与面板优化 | 提升可用性 |
| P2 | 前后端类型同步 | 数据完整性，非阻塞 |

---

## 不在本子项目范围内

以下内容属于后续子项目：
- **子项目2：整合包全生命周期** — 模板创建、导入后编辑、版本更新检查、导出预览与修复
- **子项目3：应用基础设施** — 设置页面、撤销/重做、批量操作、拖拽操作
- **子项目4：质量与运维** — 测试框架、安全性、性能优化、CI/CD
