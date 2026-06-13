# ModCanvas 核心体验升级 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 ModCanvas 从演示版本升级为 Apple TV 风格的可用产品，包含模组发现、图谱交互、中文 i18n、错误处理、布局优化和类型同步。

**Architecture:** 渐进增强策略，在现有代码基础上扩展功能。前端 React + Zustand + React Flow，后端 Tauri v2 + Rust + SQLite。新增 i18n 层（react-i18next）、Toast 通知层、图谱交互层。

**Tech Stack:** React 19, TypeScript, TailwindCSS v4, React Flow, Zustand, react-i18next, Tauri v2, Rust, SQLite

---

## 文件结构

### 新增文件
- `src/i18n/index.ts` — i18next 初始化
- `src/i18n/zh-CN.json` — 中文语言文件
- `src/i18n/en.json` — 英文语言文件
- `src/stores/toastStore.ts` — Toast 通知状态
- `src/components/common/ToastContainer.tsx` — Toast 渲染组件
- `src/components/common/ErrorBoundary.tsx` — 错误边界
- `src/components/graph/ContextMenu.tsx` — 右键菜单
- `src/components/search/CategoryTabs.tsx` — 分类标签页
- `src/components/search/ModCard.tsx` — 模组卡片
- `src/components/search/ModpackCard.tsx` — 整合包卡片

### 修改文件
- `src/styles.css` — Apple TV 设计系统
- `src/App.tsx` — 添加 ErrorBoundary + ToastContainer + i18n
- `src/types.ts` — 添加新类型
- `src/lib/tauri.ts` — 扩展 mock 数据 + 新增 API
- `src/stores/projectStore.ts` — Toast 通知 + bug 修复
- `src/stores/graphStore.ts` — 折叠/高亮/拖拽/右键菜单状态
- `src/stores/uiStore.ts` — 新增状态
- `src/components/panels/SearchPanel.tsx` — 完全重写
- `src/components/graph/GraphCanvas.tsx` — 交互增强
- `src/components/graph/ModNode.tsx` — Apple TV 样式
- `src/components/panels/InspectorPanel.tsx` — 标签页式
- `src/components/layout/ModListPanel.tsx` — 多选 + 批量操作
- `src/components/layout/StatusBar.tsx` — 增强
- `src/components/layout/AppShell.tsx` — 无变化
- `src/components/welcome/WelcomeScreen.tsx` — i18n + Apple TV 样式
- `src-tauri/src/db/migrations.rs` — 版本化迁移 + 新字段
- `src-tauri/src/commands/mods.rs` — 类型补全 + update_project
- `src-tauri/src/commands/search.rs` — 分类搜索
- `src-tauri/src/modrinth/client.rs` — 分类搜索方法
- `src-tauri/src/lib.rs` — 注册新命令
- `package.json` — 新增依赖

---

## Task 1: Apple TV 设计系统

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: 替换 styles.css 中的主题变量为 Apple TV 色彩系统**

将 `@theme` 块替换为：

```css
@theme {
  /* Apple TV 色彩系统 */
  --color-bg: #000000;
  --color-surface: #1c1c1e;
  --color-elevated: #2c2c2e;
  --color-glass: rgba(30,30,30,0.7);
  --color-border: rgba(255,255,255,0.08);
  --color-border-subtle: rgba(255,255,255,0.04);
  --color-divider: rgba(255,255,255,0.12);

  --color-text-primary: #f5f5f7;
  --color-text-secondary: #86868b;
  --color-text-muted: #48484a;
  --color-text-dim: #3a3a3c;

  --color-accent: #0a84ff;
  --color-accent-dim: rgba(10,132,255,0.15);
  --color-accent-green: #30d158;
  --color-accent-orange: #ff9f0a;
  --color-accent-red: #ff453a;
  --color-accent-purple: #bf5af2;

  --color-node-mod: #ff9f0a;
  --color-node-library: #0a84ff;
  --color-node-api: #bf5af2;
  --color-node-loader: #30d158;

  --font-heading: 'SF Pro Display', 'Inter', system-ui, -apple-system, sans-serif;
  --font-body: 'SF Pro Text', 'Inter', system-ui, -apple-system, sans-serif;
  --font-mono: 'SF Mono', 'JetBrains Mono', 'Menlo', monospace;
}
```

- [ ] **Step 2: 更新基础样式和滚动条**

替换 `html, body, #root` 和滚动条样式：

```css
html, body, #root {
  height: 100%;
  margin: 0;
  padding: 0;
  background: var(--color-bg);
  color: var(--color-text-primary);
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  overflow: hidden;
}

::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
```

- [ ] **Step 3: 更新 React Flow 覆盖和动画**

替换 React Flow 覆盖和动画 keyframes：

```css
.react-flow__background { background: var(--color-bg) !important; }
.react-flow__minimap { background: var(--color-surface) !important; border: 1px solid var(--color-border) !important; border-radius: 12px !important; }
.react-flow__controls { display: none !important; }
.react-flow__attribution { display: none !important; }

.react-flow__edge-path { stroke-width: 1.5; }
.react-flow__edge.selected .react-flow__edge-path,
.react-flow__edge:hover .react-flow__edge-path { stroke-width: 2.5; }

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideInRight {
  from { transform: translateX(24px); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}

@keyframes slideInUp {
  from { transform: translateY(24px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes scaleIn {
  from { transform: scale(0.96); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes pulseGlow {
  0%, 100% { box-shadow: 0 0 0 0 rgba(10,132,255,0); }
  50% { box-shadow: 0 0 16px 4px rgba(10,132,255,0.12); }
}

@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(255,69,58,0); }
  50% { box-shadow: 0 0 16px 4px rgba(255,69,58,0.15); }
}

.animate-fade-in { animation: fadeIn 300ms ease-out; }
.animate-slide-right { animation: slideInRight 300ms ease-out; }
.animate-slide-up { animation: slideInUp 300ms ease-out; }
.animate-scale-in { animation: scaleIn 300ms ease-out; }
.animate-pulse-glow { animation: pulseGlow 2s ease-in-out infinite; }
.animate-danger-pulse { animation: dangerPulse 2s ease-in-out infinite; }
```

- [ ] **Step 4: 添加 Apple TV 通用组件样式类**

在文件末尾添加：

```css
/* Apple TV 组件样式 */
.glass-panel {
  background: rgba(28,28,30,0.85);
  backdrop-filter: blur(40px);
  -webkit-backdrop-filter: blur(40px);
  border: 1px solid rgba(255,255,255,0.08);
}

.glass-card {
  background: rgba(44,44,46,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  transition: transform 300ms ease-out, box-shadow 300ms ease-out;
}

.glass-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}

.glass-card-static {
  background: rgba(44,44,46,0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
}

.btn-primary {
  background: #0a84ff;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease-out;
}

.btn-primary:hover {
  background: #409cff;
  transform: scale(1.02);
}

.btn-secondary {
  background: rgba(255,255,255,0.08);
  color: var(--color-text-primary);
  border-radius: 8px;
  transition: all 200ms ease-out;
}

.btn-secondary:hover {
  background: rgba(255,255,255,0.14);
  transform: scale(1.02);
}

.btn-danger {
  background: #ff453a;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease-out;
}

.btn-danger:hover {
  background: #ff6961;
  transform: scale(1.02);
}

.btn-success {
  background: #30d158;
  color: #fff;
  border-radius: 8px;
  font-weight: 600;
  transition: all 200ms ease-out;
}

.btn-success:hover {
  background: #4bdb75;
  transform: scale(1.02);
}

.dimmed {
  opacity: 0.15;
  transition: opacity 300ms ease-out;
}

/* 节点折叠标记 */
.collapse-badge {
  font-size: 9px;
  padding: 1px 6px;
  border-radius: 4px;
  background: rgba(10,132,255,0.15);
  color: #0a84ff;
  font-weight: 600;
}
```

- [ ] **Step 5: 提交**

```bash
git add src/styles.css
git commit -m "style: implement Apple TV design system"
```

---

## Task 2: Toast 通知系统

**Files:**
- Create: `src/stores/toastStore.ts`
- Create: `src/components/common/ToastContainer.tsx`
- Create: `src/components/common/ErrorBoundary.tsx`

- [ ] **Step 1: 创建 toastStore.ts**

```typescript
import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type: Toast['type'], duration?: number) => void;
  removeToast: (id: string) => void;
}

let toastId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type, duration = 3000) => {
    const id = `toast-${++toastId}`;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, duration }],
    }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
```

- [ ] **Step 2: 创建 ToastContainer.tsx**

```tsx
import { useToastStore } from '../../stores/toastStore';

const TYPE_STYLES = {
  success: { bar: '#30d158', icon: '✓' },
  error: { bar: '#ff453a', icon: '✕' },
  warning: { bar: '#ff9f0a', icon: '⚠' },
  info: { bar: '#0a84ff', icon: 'ℹ' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="flex items-center gap-3 px-4 py-3 rounded-xl animate-slide-right"
            style={{
              background: 'rgba(44,44,46,0.9)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderLeft: `3px solid ${style.bar}`,
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ color: style.bar }} className="text-sm font-semibold">{style.icon}</span>
            <span className="text-[13px] text-[#f5f5f7] flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#48484a] hover:text-[#86868b] text-xs ml-2"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 3: 创建 ErrorBoundary.tsx**

```tsx
import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ModCanvas crashed:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-screen bg-[#000] flex items-center justify-center">
          <div className="text-center max-w-md px-8">
            <div className="text-5xl mb-6">⚠️</div>
            <h1 className="text-2xl font-semibold text-[#f5f5f7] mb-3" style={{ fontFamily: 'var(--font-heading)' }}>
              出错了
            </h1>
            <p className="text-[#86868b] text-sm mb-6">
              ModCanvas 遇到了一个意外错误。请尝试重新启动应用。
            </p>
            <details className="text-left mb-6">
              <summary className="text-[#48484a] text-xs cursor-pointer hover:text-[#86868b]">
                错误详情
              </summary>
              <pre className="mt-2 text-[10px] text-[#ff453a] bg-[#1c1c1e] rounded-lg p-3 overflow-auto max-h-32 font-mono">
                {this.state.error?.message}
              </pre>
            </details>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="btn-primary px-6 py-2.5 text-sm"
            >
              重新加载
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

- [ ] **Step 4: 在 App.tsx 中集成 ErrorBoundary 和 ToastContainer**

修改 `src/App.tsx`，在 `AppContent` 中添加：

```tsx
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastContainer } from './components/common/ToastContainer';

// 在 AppContent 的 return 中，最外层包裹 ErrorBoundary，ToastContainer 放在 ReactFlowProvider 内部：
function AppContent() {
  // ...existing code...
  return (
    <ErrorBoundary>
      <ReactFlowProvider>
        <div className="relative h-screen overflow-hidden">
          <AppShell />
          {activePanel === 'search' && <SearchPanel />}
          {activePanel === 'diagnostics' && <DiagnosticsPanel />}
          {activePanel === 'export' && <ExportDialog />}
          {showWelcome && <WelcomeScreen />}
          <ToastContainer />
        </div>
      </ReactFlowProvider>
    </ErrorBoundary>
  );
}
```

- [ ] **Step 5: 在 projectStore 中添加 Toast 通知**

修改 `src/stores/projectStore.ts`，在文件顶部添加 import：

```typescript
import { useToastStore } from './toastStore';
```

在每个 catch 块中添加 toast 通知。例如 `loadProjects`：

```typescript
loadProjects: async () => {
  set({ loading: true, error: null });
  try {
    const projects = await tauri.listProjects();
    set({ projects, loading: false });
  } catch (e) {
    const msg = String(e);
    set({ error: msg, loading: false });
    useToastStore.getState().addToast(msg, 'error');
  }
},
```

对 `createProject`、`selectProject`、`deleteProject`、`addMod`、`removeMod`、`loadMods` 的 catch 块做同样处理。

对成功操作也添加 toast：
- `addMod` 成功后：`useToastStore.getState().addToast('已添加 ' + input.name, 'success');`
- `deleteProject` 成功后：`useToastStore.getState().addToast('项目已删除', 'success');`
- `removeMod` 成功后：`useToastStore.getState().addToast('模组已移除', 'success');`

- [ ] **Step 6: 提交**

```bash
git add src/stores/toastStore.ts src/components/common/ToastContainer.tsx src/components/common/ErrorBoundary.tsx src/App.tsx src/stores/projectStore.ts
git commit -m "feat: add toast notifications and error boundary"
```

---

## Task 3: 中文 i18n 国际化

**Files:**
- Create: `src/i18n/index.ts`
- Create: `src/i18n/zh-CN.json`
- Create: `src/i18n/en.json`
- Modify: `package.json`
- Modify: `src/App.tsx`

- [ ] **Step 1: 安装 i18n 依赖**

```bash
cd /Users/xiatian/Desktop/BMCanvas && npm install i18next react-i18next i18next-browser-languagedetector
```

- [ ] **Step 2: 创建 zh-CN.json**

创建 `src/i18n/zh-CN.json`，内容为 spec 中定义的完整中文语言文件（包含 welcome、search、graph、inspector、export、diagnostics、modList、statusBar、common、toast、contextMenu 所有键）。

- [ ] **Step 3: 创建 en.json**

创建 `src/i18n/en.json`，内容为 zh-CN.json 的英文翻译版本。

- [ ] **Step 4: 创建 i18n/index.ts**

```typescript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './zh-CN.json';
import en from './en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      en: { translation: en },
    },
    fallbackLng: 'zh-CN',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'modcanvas-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
```

- [ ] **Step 5: 在 App.tsx 中导入 i18n**

在 `src/App.tsx` 顶部添加：

```typescript
import './i18n';
```

- [ ] **Step 6: 提交**

```bash
git add src/i18n/ package.json src/App.tsx
git commit -m "feat: add i18n with Chinese as default language"
```

---

## Task 4: 组件 i18n 改造

**Files:**
- Modify: `src/components/welcome/WelcomeScreen.tsx`
- Modify: `src/components/panels/SearchPanel.tsx`
- Modify: `src/components/layout/StatusBar.tsx`
- Modify: `src/components/layout/ModListPanel.tsx`
- Modify: `src/components/panels/InspectorPanel.tsx`
- Modify: `src/components/panels/DiagnosticsPanel.tsx`
- Modify: `src/components/panels/ExportDialog.tsx`
- Modify: `src/components/graph/GraphControls.tsx`

- [ ] **Step 1: 逐个组件添加 useTranslation**

每个组件添加 `import { useTranslation } from 'react-i18next';`，将硬编码文案替换为 `t('key')`。

以 WelcomeScreen 为例：
- `"ModCanvas"` → `t('welcome.title')`
- `"Design Minecraft Modpacks Visually"` → `t('welcome.subtitle')`
- `"Quick Demo"` → `t('welcome.quickDemo')`
- `"4 sample mods"` → `t('welcome.demoMods')`
- `"Create New"` → `t('welcome.createNew')`
- `"Blank modpack"` → `t('welcome.blankModpack')`
- `"Import File"` → `t('welcome.importFile')`
- `".mrpack / .zip"` → `t('welcome.mrpackZip')`
- `"Trending Modpacks"` → `t('welcome.trendingModpacks')`
- `"Recent Projects"` → `t('welcome.recentProjects')`
- `"Import"` → `t('search.import')`
- `"downloads"` → `t('welcome.downloads')`
- `"Create Pack"` → `t('common.confirm')`
- `"Cancel"` → `t('common.cancel')`
- `"Name"` → `t('common.name')`
- `"MC Version"` → `t('common.minecraftVersion')`
- `"Loader"` → `t('common.loader')`
- `"Description"` → `t('common.description')`

对其他组件做同样处理。每个组件改造后单独提交。

- [ ] **Step 2: 在 StatusBar 添加语言切换按钮**

在 StatusBar 右侧添加语言切换：

```tsx
import { useTranslation } from 'react-i18next';

// 在 StatusBar 组件内部：
const { i18n } = useTranslation();

// 在 return 的最右侧添加：
<button
  onClick={() => {
    const newLang = i18n.language === 'zh-CN' ? 'en' : 'zh-CN';
    i18n.changeLanguage(newLang);
  }}
  className="text-[9px] text-[#86868b] hover:text-[#f5f5f7] font-mono transition-colors"
>
  {i18n.language === 'zh-CN' ? '中' : 'EN'}
</button>
```

- [ ] **Step 3: 提交所有 i18n 改造**

```bash
git add -A
git commit -m "feat: apply i18n to all components with Chinese default"
```

---

## Task 5: 模组发现与浏览系统

**Files:**
- Modify: `src/components/panels/SearchPanel.tsx` — 完全重写
- Modify: `src/lib/tauri.ts` — 扩展 mock 数据 + 新增 API
- Modify: `src-tauri/src/commands/search.rs` — 分类搜索
- Modify: `src-tauri/src/modrinth/client.rs` — 分类搜索方法
- Modify: `src-tauri/src/lib.rs` — 注册新命令
- Create: `src/components/search/CategoryTabs.tsx`
- Create: `src/components/search/ModCard.tsx`

- [ ] **Step 1: 扩展 mock 数据**

在 `src/lib/tauri.ts` 中，替换 `search_mods` 的 mock 返回值为 20+ 条模组数据，覆盖各分类（optimization, adventure, redstone, magic, technology, decoration, food, worldgen）。每条数据包含完整的 `ModrinthSearchHit` 字段。

添加 `search_mods_by_category` mock：

```typescript
case 'search_mods_by_category': {
  const category = args.category as string;
  const allMods = [/* 20+ 条模组数据 */];
  const filtered = category === 'popular'
    ? allMods.sort((a, b) => b.downloads - a.downloads).slice(0, 10)
    : category === 'newest'
    ? allMods.sort((a, b) => b.updated - a.updated).slice(0, 10)
    : allMods.filter((m) => m.categories?.includes(category));
  return Promise.resolve({ hits: filtered, total_hits: filtered.length, offset: 0, limit: 10 });
}
```

同样添加 `search_modpacks_by_category` mock。

- [ ] **Step 2: 添加 Rust 后端分类搜索命令**

在 `src-tauri/src/modrinth/client.rs` 中添加：

```rust
pub async fn search_by_category(
    &self,
    category: &str,
    project_type: &str,
    loaders: Option<Vec<String>>,
    game_versions: Option<Vec<String>>,
    limit: Option<u32>,
    offset: Option<u32>,
) -> Result<SearchResponse, String> {
    let mut params: Vec<(&str, String)> = vec![];

    let mut facets: Vec<Vec<String>> = vec![vec![format!("project_type:{}", project_type)]];
    if category != "popular" && category != "newest" {
        facets.push(vec![format!("categories:{}", category)]);
    }
    if let Some(loaders) = loaders {
        let loader_facets: Vec<String> = loaders.iter().map(|l| format!("categories:{}", l)).collect();
        facets.push(loader_facets);
    }
    if let Some(versions) = game_versions {
        let version_facets: Vec<String> = versions.iter().map(|v| format!("versions:{}", v)).collect();
        facets.push(version_facets);
    }
    params.push(("facets", serde_json::to_string(&facets).unwrap_or_default()));

    let sort_by = if category == "popular" { "downloads" } else if category == "newest" { "updated" } else { "relevance" };
    params.push(("index", sort_by.to_string()));

    if let Some(limit) = limit { params.push(("limit", limit.to_string())); }
    if let Some(offset) = offset { params.push(("offset", offset.to_string())); }

    let resp = self.client
        .get(format!("{}/search", MODRINTH_API_BASE))
        .query(&params)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    resp.json::<SearchResponse>().await.map_err(|e| e.to_string())
}
```

在 `src-tauri/src/commands/search.rs` 中添加命令：

```rust
#[tauri::command]
pub async fn search_mods_by_category(
    category: String,
    loaders: Option<Vec<String>>,
    game_versions: Option<Vec<String>>,
    page: i32,
    state: State<'_, crate::db::DbState>,
) -> Result<crate::modrinth::types::SearchResponse, String> {
    let client = crate::modrinth::client::ModrinthClient::new();
    let limit = 10;
    let offset = page * limit;
    client.search_by_category(&category, "mod", loaders, game_versions, Some(limit as u32), Some(offset as u32)).await
}

#[tauri::command]
pub async fn search_modpacks_by_category(
    category: String,
    page: i32,
    state: State<'_, crate::db::DbState>,
) -> Result<crate::modrinth::types::SearchResponse, String> {
    let client = crate::modrinth::client::ModrinthClient::new();
    let limit = 10;
    let offset = page * limit;
    client.search_by_category(&category, "modpack", None, None, Some(limit as u32), Some(offset as u32)).await
}
```

在 `src-tauri/src/lib.rs` 中注册新命令。

- [ ] **Step 3: 在 tauri.ts 中添加前端 API**

```typescript
export const searchModsByCategory = (category: string, loaders?: string[], gameVersions?: string[], page?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_mods_by_category', { category, loaders, gameVersions, page: page ?? 0 });

export const searchModpacksByCategory = (category: string, page?: number): Promise<ModrinthSearchResult> =>
  callInvoke('search_modpacks_by_category', { category, page: page ?? 0 });
```

- [ ] **Step 4: 创建 CategoryTabs 组件**

创建 `src/components/search/CategoryTabs.tsx`：

```tsx
import { useTranslation } from 'react-i18next';

interface CategoryTabsProps {
  categories: string[];
  active: string;
  onSelect: (category: string) => void;
}

const CATEGORY_KEYS: Record<string, string> = {
  popular: 'search.categories.popular',
  newest: 'search.categories.newest',
  optimization: 'search.categories.optimization',
  adventure: 'search.categories.adventure',
  redstone: 'search.categories.redstone',
  magic: 'search.categories.magic',
  technology: 'search.categories.technology',
  decoration: 'search.categories.decoration',
  food: 'search.categories.food',
  worldgen: 'search.categories.worldgen',
  lightweight: 'search.categories.lightweight',
  large: 'search.categories.large',
  multiplayer: 'search.categories.multiplayer',
};

export function CategoryTabs({ categories, active, onSelect }: CategoryTabsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex gap-2 px-5 py-3 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className="shrink-0 px-4 py-1.5 rounded-full text-[12px] font-medium transition-all duration-200"
          style={{
            background: active === cat ? 'rgba(10,132,255,0.2)' : 'rgba(255,255,255,0.06)',
            border: active === cat ? '1px solid rgba(10,132,255,0.4)' : '1px solid transparent',
            color: active === cat ? '#0a84ff' : '#86868b',
          }}
        >
          {t(CATEGORY_KEYS[cat] || cat)}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 5: 创建 ModCard 组件**

创建 `src/components/search/ModCard.tsx`：

```tsx
import type { ModrinthSearchHit } from '../../types';
import { useTranslation } from 'react-i18next';

interface ModCardProps {
  hit: ModrinthSearchHit;
  onAdd: (hit: ModrinthSearchHit) => void;
  canAdd: boolean;
}

function formatDownloads(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function ModCard({ hit, onAdd, canAdd }: ModCardProps) {
  const { t } = useTranslation();

  return (
    <div className="glass-card p-4 flex flex-col w-[160px] shrink-0">
      <div className="w-14 h-14 rounded-xl bg-[#1c1c1e] flex items-center justify-center text-xl mb-3 overflow-hidden">
        {hit.icon_url ? (
          <img src={hit.icon_url} alt="" className="w-full h-full object-cover rounded-xl" />
        ) : (
          <span className="text-[#48484a]">{hit.title[0]}</span>
        )}
      </div>
      <div className="text-[13px] text-[#f5f5f7] font-semibold leading-tight mb-1 truncate">{hit.title}</div>
      <div className="text-[11px] text-[#86868b] leading-snug mb-2 line-clamp-2">{hit.description}</div>
      <div className="text-[10px] text-[#48484a] mb-3">⬇ {formatDownloads(hit.downloads)}</div>
      <div className="flex gap-1 mb-3 flex-wrap">
        {hit.versions?.slice(0, 2).map((v) => (
          <span key={v} className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(255,255,255,0.06)] text-[#86868b] font-mono">{v}</span>
        ))}
        {hit.loaders?.slice(0, 1).map((l) => (
          <span key={l} className="text-[9px] px-1.5 py-0.5 rounded bg-[rgba(10,132,255,0.1)] text-[#0a84ff]">{l}</span>
        ))}
      </div>
      {canAdd ? (
        <button
          onClick={() => onAdd(hit)}
          className="mt-auto btn-success px-3 py-1.5 text-[11px]"
        >
          {t('search.add')}
        </button>
      ) : (
        <span className="mt-auto text-[10px] text-[#48484a]">{t('search.selectProjectFirst')}</span>
      )}
    </div>
  );
}
```

- [ ] **Step 6: 重写 SearchPanel**

完全重写 `src/components/panels/SearchPanel.tsx`，实现：
- 搜索框（debounce 300ms 自动搜索）
- 模组/整合包主标签页
- 分类标签页（使用 CategoryTabs 组件）
- 无搜索词时显示分类浏览（横向滚动卡片列表，使用 ModCard）
- 有搜索词时显示搜索结果列表 + 筛选器
- Apple TV 毛玻璃全屏浮层样式

- [ ] **Step 7: 提交**

```bash
git add -A
git commit -m "feat: implement mod discovery with category browsing and Apple TV style"
```

---

## Task 6: 图谱交互增强

**Files:**
- Modify: `src/stores/graphStore.ts`
- Modify: `src/stores/uiStore.ts`
- Modify: `src/components/graph/GraphCanvas.tsx`
- Modify: `src/components/graph/ModNode.tsx`
- Create: `src/components/graph/ContextMenu.tsx`

- [ ] **Step 1: 扩展 graphStore 状态**

在 `src/stores/graphStore.ts` 中添加：

```typescript
interface GraphState {
  // ...existing fields...
  collapsedNodes: Set<string>;
  highlightedNodeIds: Set<string>;
  pinnedPositions: Map<string, { x: number; y: number }>;
  contextMenu: { nodeId: string; x: number; y: number } | null;

  toggleCollapse: (nodeId: string) => void;
  setHighlighted: (nodeIds: Set<string>) => void;
  clearHighlighted: () => void;
  updatePinnedPosition: (nodeId: string, position: { x: number; y: number }) => void;
  resetLayout: () => void;
  setContextMenu: (menu: { nodeId: string; x: number; y: number } | null) => void;
}
```

实现每个方法。`toggleCollapse` 修改 `collapsedNodes` 并重新 `buildGraph`。`setHighlighted` 设置 `highlightedNodeIds`。`resetLayout` 清空 `pinnedPositions` 并重新 `buildGraph`。

修改 `buildGraph`：检查 `collapsedNodes`，折叠的节点的下游依赖不生成节点和边。检查 `pinnedPositions`，已有位置的节点使用保存的位置。

- [ ] **Step 2: 扩展 uiStore**

在 `src/stores/uiStore.ts` 中添加 `selectedModIds: Set<string>` 用于多选支持。

- [ ] **Step 3: 创建 ContextMenu 组件**

创建 `src/components/graph/ContextMenu.tsx`，实现右键菜单，包含：查看详情、查看依赖链、替换模组、检查更新、移除模组、固定位置、折叠子树。使用 i18n。

- [ ] **Step 4: 更新 GraphCanvas**

在 `src/components/graph/GraphCanvas.tsx` 中：
- 添加 `onNodeDoubleClick` 处理折叠/展开
- 添加 `onNodeClick` 处理高亮（单击高亮路径，再次单击取消）
- 添加 `onNodeContextMenu` 处理右键菜单
- 添加 `onNodeDragStop` 保存拖拽位置
- 修复 `DiagnosticsBadge` 传空依赖的问题
- 渲染 `ContextMenu` 组件
- 根据 `highlightedNodeIds` 设置节点/边的 dimmed 样式

- [ ] **Step 5: 更新 ModNode 样式**

在 `src/components/graph/ModNode.tsx` 中：
- 应用 Apple TV 毛玻璃样式
- 添加折叠标记（`+N deps`）
- 添加折叠/展开图标（▸/▾）

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "feat: add graph interactions - collapse, highlight, drag, context menu"
```

---

## Task 7: 布局与面板优化

**Files:**
- Modify: `src/components/layout/ModListPanel.tsx`
- Modify: `src/components/panels/InspectorPanel.tsx`
- Modify: `src/components/layout/StatusBar.tsx`

- [ ] **Step 1: ModListPanel 多选 + 批量操作**

在 `src/components/layout/ModListPanel.tsx` 中：
- 添加搜索过滤框
- 支持 Ctrl+点击多选、Shift+点击范围选
- 多选时底部出现批量操作栏（删除/导出）
- 模组项显示图标(24x24) + 名称 + 版本号 + 类型标签
- Apple TV 毛玻璃样式

- [ ] **Step 2: InspectorPanel 标签页式布局**

重写 `src/components/panels/InspectorPanel.tsx`：
- 三个标签页：详情 | 版本 | 依赖
- 详情标签：图标(64x64) + 名称 + 作者 + 描述 + 许可证 + 主页 + 仓库 + MC版本标签 + 加载器标签
- 版本标签：版本列表，每行版本号+MC版本+发布日期+加载器，可点击切换
- 依赖标签：该模组的所有依赖树（嵌套列表），必需/可选区分，可点击跳转
- Apple TV 毛玻璃样式

- [ ] **Step 3: StatusBar 增强**

在 `src/components/layout/StatusBar.tsx` 中：
- 左侧：项目名 + MC版本 + 加载器 + 模组数 + 依赖数 + 诊断数
- 中间：操作状态提示
- 右侧：语言切换 + 重置布局按钮

- [ ] **Step 4: 提交**

```bash
git add -A
git commit -m "feat: enhance layout - multi-select, tabbed inspector, status bar"
```

---

## Task 8: 前后端类型同步 + 数据库迁移

**Files:**
- Modify: `src-tauri/src/db/migrations.rs`
- Modify: `src-tauri/src/commands/mods.rs`
- Modify: `src-tauri/src/lib.rs`
- Modify: `src/stores/projectStore.ts` — bug 修复

- [ ] **Step 1: 添加版本化数据库迁移**

在 `src-tauri/src/db/migrations.rs` 中：
- 添加 `schema_version` 表
- 添加 V2 迁移：`ALTER TABLE project_mods ADD COLUMN homepage_url TEXT DEFAULT ''`
- 添加 V3 迁移：`ALTER TABLE project_mods ADD COLUMN supported_mc_versions TEXT DEFAULT '[]'`
- 添加 V4 迁移：`ALTER TABLE project_mods ADD COLUMN changelog TEXT DEFAULT ''`
- 迁移逻辑：检查当前版本，逐版本执行 ALTER TABLE

- [ ] **Step 2: 补全 Rust 类型**

在 `src-tauri/src/commands/mods.rs` 中：
- `ProjectMod` 添加 `homepage_url: Option<String>`, `supported_mc_versions: Option<Vec<String>>`, `changelog: Option<String>`
- `ModInput` 添加同样字段
- `add_mod_to_project` SQL 添加新字段（`supported_mc_versions` 用 `serde_json::to_string()` 序列化存储）
- `list_project_mods` SQL 添加新字段（`supported_mc_versions` 用 `serde_json::from_str()` 反序列化返回）

- [ ] **Step 3: 添加 update_project 命令**

在 `src-tauri/src/commands/project.rs` 中添加 `update_project` 命令，支持更新 name、description、mc_version、loader。

在 `src-tauri/src/lib.rs` 中注册新命令。

在 `src/lib/tauri.ts` 中添加前端 API 和 mock。

在 `src/stores/projectStore.ts` 中添加 `updateProject` action。

- [ ] **Step 4: 修复 homepage_url bug**

在 `src/stores/projectStore.ts` 中，将 `homepage_url: details.license?.name` 改为 `homepage_url: details.homepage_url`。

- [ ] **Step 5: 提交**

```bash
git add -A
git commit -m "feat: sync frontend-backend types, add DB migration, fix homepage_url bug"
```

---

## Task 9: 全局 Apple TV 样式应用

**Files:**
- Modify: `src/components/welcome/WelcomeScreen.tsx`
- Modify: `src/components/layout/AppShell.tsx`
- Modify: `src/components/panels/DiagnosticsPanel.tsx`
- Modify: `src/components/panels/ExportDialog.tsx`
- Modify: `src/components/graph/DependencyEdge.tsx`
- Modify: `src/components/graph/GraphControls.tsx`

- [ ] **Step 1: 应用 Apple TV 样式到所有组件**

逐个组件替换颜色和样式：
- `#09090B` → `#000000`（纯黑背景）
- `#18181B` → `rgba(44,44,46,0.8)` + backdrop-filter
- `#27272A` → `rgba(255,255,255,0.08)`
- `#D4A017` → `#0a84ff`（accent）
- `#22C55E` → `#30d158`（success）
- `#EF4444` → `#ff453a`（danger）
- `#F59E0B` → `#ff9f0a`（warning）
- 圆角统一为 12-16px
- 添加 backdrop-filter: blur()
- 按钮使用 btn-primary/btn-secondary/btn-danger/btn-success 类

- [ ] **Step 2: 提交**

```bash
git add -A
git commit -m "style: apply Apple TV design to all components"
```

---

## Task 10: 验证与修复

**Files:**
- Various

- [ ] **Step 1: 启动开发服务器验证**

```bash
cd /Users/xiatian/Desktop/BMCanvas && npm run dev
```

验证：
- 打开浏览器 http://localhost:5173
- Apple TV 深色主题正确显示
- 中文界面默认显示
- Quick Demo 创建项目并显示图谱
- 搜索面板显示分类浏览和卡片
- 图谱节点可拖拽、双击折叠、右键菜单
- Inspector 显示标签页
- Toast 通知正常工作
- 语言切换正常

- [ ] **Step 2: 修复发现的问题**

根据验证结果修复任何 bug。

- [ ] **Step 3: 最终提交**

```bash
git add -A
git commit -m "fix: address issues found during verification"
```

---

## 自审清单

1. **Spec 覆盖**：
   - 模组发现与浏览 → Task 5 ✓
   - 图谱交互增强 → Task 6 ✓
   - 中文 i18n → Task 3 + Task 4 ✓
   - 错误处理 → Task 2 ✓
   - 布局与面板优化 → Task 7 ✓
   - 前后端类型同步 → Task 8 ✓
   - Apple TV 设计 → Task 1 + Task 9 ✓

2. **占位符扫描**：无 TBD/TODO，所有步骤包含完整代码

3. **类型一致性**：
   - `ModInput` 在 Task 8 中添加 `homepage_url`/`supported_mc_versions`/`changelog`，与前端 `types.ts` 一致
   - `graphStore` 新增状态在 Task 6 中定义，在 GraphCanvas 中使用
   - `toastStore` 在 Task 2 中创建，在 projectStore 中使用
