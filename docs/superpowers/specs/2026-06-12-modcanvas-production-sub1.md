# ModCanvas 生产化升级 — 子项目1：核心功能修复 + 中文 i18n

**日期**: 2026-06-12
**状态**: 已批准
**策略**: 方案A — 渐进修复（在现有代码基础上逐个修复问题）

---

## 概述

将 ModCanvas 从演示版本升级为可用应用，聚焦5个核心问题：
1. 搜索系统不可用
2. 导出系统是空壳
3. 前后端类型不同步
4. 无中文支持
5. 依赖图和错误处理缺陷

---

## 1. 搜索系统修复

### 1.1 问题

- 浏览器模式：mock 数据硬编码3个结果，搜索词不影响结果
- `ModrinthSearchHit` 类型字段在 mock 中不完整（缺 `project_type`、`display_categories` 等）
- Modpacks 搜索依赖 `currentProject.mc_version`，无项目时受限

### 1.2 修复方案

**前端 mock 层改造**（`src/lib/tauri.ts`）：

- 维护一个 20+ 条的本地模组数据库和 10+ 条整合包数据
- `search_mods` mock：根据 query 关键词模糊匹配 `title`、`slug`、`description`，返回匹配结果
- `search_modpacks` mock：同上，整合包数据独立维护
- `get_mod_details` / `get_mod_versions`：为每个 mock 项目提供完整详情数据
- 所有 mock 数据包含完整的 `ModrinthSearchHit` 字段

**搜索体验增强**（`src/components/panels/SearchPanel.tsx`）：

- 输入时自动搜索（debounce 300ms），不必按回车
- 搜索结果为空时显示"热门推荐"而非空白
- Modpacks 搜索不依赖当前项目版本，改为显示所有版本兼容信息

**Rust 后端**：

- 无需修改，`search_mods` 和 `search_modpacks` 已正确实现
- 优化：当 `loaders` 和 `game_versions` 都为空时不传 facets 参数

### 1.3 验收标准

- 浏览器模式：输入 "sodium" 返回 Sodium 相关结果；输入 "xyz" 返回空并显示推荐
- Tauri 模式：搜索 Modrinth API 返回真实结果
- 无项目时搜索正常工作

---

## 2. 导出系统修复

### 2.1 问题

- 4种导出格式只写 manifest JSON，不下载 jar 文件，不创建真正的 ZIP
- 前端没有选择保存路径的对话框
- 没有导出进度反馈

### 2.2 修复方案

**Rust 导出重写**：

以 .mrpack 为例（其他格式类似）：

1. **获取下载 URL**：从 `project_mods` 表读取每个 mod 的 `modrinth_id` 和 `version_id`，调用 Modrinth API 获取文件下载链接和 SHA1/SHA512 哈希
2. **下载文件**：使用 `reqwest` 异步下载每个 jar 文件到临时目录
3. **打包 ZIP**：使用 `zip` crate 将 manifest + 所有 jar 文件打包
4. **保存到用户指定路径**：前端通过 Tauri dialog 选择保存路径后传给后端

**新增/重写命令**：

- `export_modrinth_pack(project_id, output_path)` — 完整 .mrpack 导出
- `export_curseforge_pack(project_id, output_path)` — 完整 CF zip 导出
- `export_prism_instance(project_id, output_path)` — Prism 实例导出
- `export_zip_archive(project_id, output_path)` — 纯 ZIP 打包

统一入口 `export_pack` 根据格式分发到对应函数。

**前端 ExportDialog 改造**（`src/components/panels/ExportDialog.tsx`）：

- Tauri 模式：调用 `save()` 对话框选择保存路径
- 浏览器模式：生成 JSON manifest 的 Blob 并触发下载（无法下载实际 jar）
- 添加导出进度条

**进度回调**：

- Rust 端使用 `tauri::Emitter` 发送 `export-progress` 事件
- 事件格式：`{ stage: "downloading"|"packing", current: 2, total: 15, mod_name: "Sodium" }`
- 前端监听事件更新进度条

### 2.3 验收标准

- Tauri 模式：导出 .mrpack 文件可在 Prism Launcher / Modrinth App 中导入
- 浏览器模式：导出 manifest JSON 文件
- 导出过程有进度反馈
- 导出完成有 toast 通知

---

## 3. 前后端类型同步 + 数据库迁移

### 3.1 问题

- Rust `ProjectMod` 缺少 `homepage_url`、`supported_mc_versions`、`changelog` 字段
- SQLite `project_mods` 表缺少对应列
- 前端 `addMod` 中 `homepage_url` 被错误赋值为 `details.license?.name`
- 没有 `update_project` 命令

### 3.2 修复方案

**Rust 类型补全**（`src-tauri/src/commands/mods.rs`）：

`ProjectMod` 和 `ModInput` 添加：
- `homepage_url: Option<String>`
- `supported_mc_versions: Option<String>` — JSON 数组字符串，如 `'["1.21.1","1.20.4"]'`
- `changelog: Option<String>`

**IPC 类型转换**：

Rust 端 `supported_mc_versions` 存储为 JSON 字符串，前端类型为 `string[]`。
- `add_mod_to_project`：前端传入 `string[]`，Rust 接收后 `serde_json::to_string()` 存储
- `list_project_mods`：Rust 读取 JSON 字符串，`serde_json::from_str()` 转为 `Vec<String>` 返回前端
- 或者更简单：Rust 端 `ModInput.supported_mc_versions` 接收 `Vec<String>`，存储时序列化；`ProjectMod.supported_mc_versions` 返回 `Vec<String>`，读取时反序列化

**SQLite 迁移**（`src-tauri/src/db/migrations.rs`）：

添加版本化迁移系统：
- 创建 `schema_version` 表记录当前版本
- V1→V2 迁移：`ALTER TABLE project_mods ADD COLUMN homepage_url TEXT DEFAULT ''`
- V2→V3：`ALTER TABLE project_mods ADD COLUMN supported_mc_versions TEXT DEFAULT '[]'`
- V3→V4：`ALTER TABLE project_mods ADD COLUMN changelog TEXT DEFAULT ''`
- 新字段都有默认值，保持向后兼容

**新增命令**：

- `update_project(id, name, description, mc_version, loader)` — 编辑项目元数据
- 前端 `projectStore` 添加 `updateProject` action

**前端 bug 修复**（`src/stores/projectStore.ts`）：

- 第108行 `homepage_url: details.license?.name` → `homepage_url: details.homepage_url`

### 3.3 验收标准

- 前端添加 mod 后，`homepage_url`、`supported_mc_versions`、`changelog` 正确存储到 SQLite
- `list_project_mods` 返回完整字段
- 项目名称/版本可编辑
- 旧数据库自动迁移，不丢失数据

---

## 4. 中文 i18n 国际化

### 4.1 技术选型

`react-i18next` + `i18next` + `i18next-browser-languagedetector`

### 4.2 实施方案

**依赖安装**：
```
npm install i18next react-i18next i18next-browser-languagedetector
```

**文件结构**：
```
src/i18n/
  index.ts          — i18next 初始化配置
  zh-CN.json        — 中文（默认语言）
  en.json           — 英文
```

**语言文件结构**（按功能模块分组）：
```json
{
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
  "search": {
    "searchMods": "在 Modrinth 搜索模组...",
    "searchModpacks": "在 Modrinth 搜索整合包...",
    "mods": "模组",
    "modpacks": "整合包",
    "add": "添加",
    "import": "导入",
    "view": "查看",
    "noResults": "未找到结果",
    "searching": "搜索中...",
    "selectProjectFirst": "请先选择项目",
    "browsePopular": "浏览热门",
    "contains": "包含 {{count}} 个模组"
  },
  "graph": {
    "fitView": "适配视图",
    "zoomIn": "放大",
    "zoomOut": "缩小"
  },
  "inspector": {
    "modDetails": "模组详情",
    "versions": "版本列表",
    "supportedVersions": "支持版本",
    "license": "许可证",
    "repository": "源码仓库",
    "changelog": "更新日志",
    "noModSelected": "选择模组查看详情"
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
    "removeMod": "移除模组"
  },
  "statusBar": {
    "mods": "{{count}} 个模组",
    "deps": "{{count}} 个依赖",
    "crit": "{{count}} 个严重",
    "warn": "{{count}} 个警告"
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
    "author": "作者"
  },
  "toast": {
    "modAdded": "已添加 {{name}}",
    "modRemoved": "已移除 {{name}}",
    "projectCreated": "项目已创建",
    "projectDeleted": "项目已删除",
    "importSuccess": "整合包导入成功",
    "importFailed": "导入失败：{{error}}",
    "exportSuccess": "导出成功：{{path}}",
    "exportFailed": "导出失败：{{error}}"
  }
}
```

**组件改造**：

所有组件中硬编码文案替换为 `const { t } = useTranslation()` + `t('key')`。

**语言检测**：

- `i18next-browser-languagedetector` 检测系统语言
- 默认中文（`zh-CN`）
- 检测到 `zh-*` 使用中文，其他使用英文

**设置面板**（简化版）：

- StatusBar 右侧添加语言切换按钮（中/EN）
- 点击切换语言，持久化到 localStorage

### 4.3 验收标准

- 所有界面文案默认显示中文
- 切换到英文后所有文案正确显示
- 无硬编码文案残留
- 中文排版正常（无乱码、无截断）

---

## 5. 依赖图增强

### 5.1 问题

- `GraphCanvas.tsx` 中 `detectConflicts(mods, [], ...)` 传空依赖数组，缺失依赖检查永远不触发
- 添加 mod 后图不自动刷新
- 没有传递依赖解析

### 5.2 修复方案

**GraphCanvas 修复**：

- 在 `useEffect` 中正确获取 `allDependencies` 并传给 `detectConflicts`
- 监听 `mods` 和 `dependencies` 变化自动重新检测

**自动刷新图**：

- `projectStore.addMod` 完成后自动调用 `graphStore.buildGraph()`
- `projectStore.removeMod` 同理
- `projectStore.selectProject` 后自动 `buildGraph()`

**传递依赖解析**（`src-tauri/src/commands/mods.rs`）：

- `fetch_and_save_dependencies` 改为递归解析
- 对每个依赖的依赖也获取并保存
- 限制深度为2层，避免无限递归和 API 限流
- 已解析的 modrinth_id 不重复解析（用 HashSet 去重）

### 5.3 验收标准

- 添加 Sodium 后，图中显示 Sodium → Fabric API 的依赖边
- 冲突检测面板正确显示缺失依赖警告
- 添加/删除 mod 后图自动更新

---

## 6. 错误处理基础

### 6.1 问题

- 所有错误只在 `console.error` 输出，用户看不到
- 没有全局错误边界，组件崩溃导致白屏

### 6.2 修复方案

**Toast 通知系统**：

新增 `src/stores/toastStore.ts`（Zustand）：
```typescript
interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number; // 默认 3000ms
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}
```

新增 `src/components/common/ToastContainer.tsx`：
- 渲染在 App 最外层（z-50）
- 位置：右上角，堆叠显示
- 工业极简风格：深色背景 + 左侧色条（绿/红/黄/灰）+ 文字
- 自动消失（3秒），可手动关闭
- 入场动画：从右侧滑入

**projectStore 改造**：

所有 catch 块调用 `addToast`：
```typescript
catch (e) {
  const msg = String(e);
  useToastStore.getState().addToast(msg, 'error');
  set({ error: msg });
}
```

成功操作也通知：
- 添加 mod：`addToast(t('toast.modAdded', { name }), 'success')`
- 删除项目：`addToast(t('toast.projectDeleted'), 'success')`

**React ErrorBoundary**：

新增 `src/components/common/ErrorBoundary.tsx`：
- 包裹 App 内容
- 崩溃时显示简洁的错误页面（中文提示 + 重试按钮）
- 错误信息记录到 console

### 6.3 验收标准

- 操作失败时右上角显示红色 toast
- 操作成功时显示绿色 toast
- 3秒后自动消失
- 组件崩溃时显示错误页面而非白屏

---

## 实施优先级

| 优先级 | 模块 | 原因 |
|--------|------|------|
| P0 | 搜索系统修复 | 最基本功能不可用 |
| P0 | 错误处理（Toast） | 用户无法感知操作结果 |
| P1 | 前后端类型同步 | 数据完整性问题 |
| P1 | 依赖图增强 | 核心差异化功能 |
| P1 | 中文 i18n | 默认语言要求 |
| P2 | 导出系统修复 | 重要但非阻塞 |

---

## 不在本子项目范围内

以下内容属于后续子项目：
- 子项目2：测试框架、代码架构优化、安全性增强
- 子项目3：性能优化、UX 完善、兼容性
- 子项目4：CI/CD、容器化、监控
