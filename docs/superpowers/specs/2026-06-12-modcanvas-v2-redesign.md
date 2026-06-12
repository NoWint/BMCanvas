# ModCanvas v2 Frontend Redesign Spec

Date: 2026-06-12

## Problem Statement

Current implementation has 5 critical issues that make it fundamentally misaligned with the PRD:

1. **Graph has no edges** — Adding mods doesn't auto-fetch dependencies, so the graph is always isolated nodes
2. **Architecture violates "graph-centric"** — Graph is one of 5 equal tabs, not the center of the application
3. **Diagnostics only 2/5 complete** — Missing version mismatch, duplicate functionality, loader conflicts
4. **Export system is empty shell** — All 4 formats produce unusable files
5. **Framer Motion unused** — No animations, no transitions, doesn't feel professional

## Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Architecture | Graph always center | PRD: "The graph canvas is the product" |
| Sidebar | Mod list panel | Like Figma layers panel, click to focus node |
| First launch | Welcome page + project selector | Like Figma/Xcode first launch |
| Node style | Info card with left color bar | Higher info density, like Xcode navigator |
| Rebuild strategy | Frontend rewrite, keep Rust backend | Backend verified, frontend too deeply flawed |

## New Architecture

### Global Layout

```
┌─── Mod List ───┌─────────── Graph Canvas ──────────┌── Inspector ──┐
│ Project Card    │                                    │ (conditional) │
│ ─────────────   │    [⌘K Search bar - floating]      │               │
│ Mod 1 (active)  │                                    │ Name          │
│ Mod 2           │    ┌─────────┐  ┌─────────┐       │ Description   │
│ Mod 3           │    │  Node   │──│  Node   │       │ Author        │
│ Library 1       │    └─────────┘  └─────────┘       │ Dependencies  │
│ API 1           │         │                          │ Versions      │
│ Loader          │    ┌─────────┐                      │ MC Versions   │
│ ─────────────   │    │  Node   │                      │ License       │
│ [+ Add Mod]     │    └─────────┘                      │ Homepage      │
│                 │                                    │ Repository    │
│                 │  [⚠ 2 Critical]    [⊞ ⤢ ⊞+]       │ Changelog     │
├─────────────────┴────────────────────────────────────┴───────────────┤
│ Status: ● ProjectName | 1.21.1 | NeoForge | 5 mods | 8 deps | 2c 1w│
└──────────────────────────────────────────────────────────────────────┘
```

### Key Principle: Graph is Always Visible

The graph canvas is the permanent center. Other features overlay on top:

- **⌘K** → Search floating panel (centered, semi-transparent backdrop)
- **⌘D** → Diagnostics panel (slides up from bottom, graph dims)
- **⌘E** → Export dialog (modal overlay)
- **Click node** → Inspector opens on right
- **Sidebar mod click** → Focus on that node in graph

### Application States

1. **No project** → Welcome page (full canvas replacement, one-time)
2. **Has project, no mods** → Empty graph with loader node + "Add your first mod" prompt
3. **Has project + mods** → Full graph experience

## Component Architecture

### New File Structure

```
src/
├── App.tsx                          # Root: layout shell + state router
├── main.tsx                         # Entry point
├── styles.css                       # Tailwind v4 + theme + React Flow overrides
├── types.ts                         # All TypeScript types
│
├── lib/
│   └── tauri.ts                     # IPC layer with mock fallback
│
├── stores/
│   ├── projectStore.ts              # Project + Mod CRUD
│   ├── graphStore.ts                # Graph nodes/edges/layout state
│   └── uiStore.ts                   # View state, panels, selections
│
├── hooks/
│   ├── useDiagnostics.ts            # Diagnostic engine hook
│   ├── useModrinth.ts               # Modrinth search/versions hook
│   └── useKeyboard.ts               # Global keyboard shortcuts
│
├── engine/
│   ├── dependencyResolver.ts        # Dependency → graph edges
│   ├── graphLayout.ts               # Dagre auto-layout
│   └── conflictDetector.ts          # 5-check diagnostic engine
│
└── components/
    ├── welcome/
    │   └── WelcomeScreen.tsx         # First launch / project selector
    │
    ├── layout/
    │   ├── AppShell.tsx              # Main 3-column layout
    │   ├── StatusBar.tsx             # Bottom status bar
    │   └── ModListPanel.tsx          # Left sidebar: project card + mod list
    │
    ├── graph/
    │   ├── GraphCanvas.tsx           # React Flow canvas (always visible)
    │   ├── ModNode.tsx               # Info card node with color bar
    │   ├── DependencyEdge.tsx        # Styled edges (required/optional/conflict)
    │   └── GraphControls.tsx         # Zoom/fit/auto-layout controls
    │
    ├── panels/
    │   ├── SearchPanel.tsx           # ⌘K floating search overlay
    │   ├── DiagnosticsPanel.tsx      # ⌘D bottom slide-up panel
    │   ├── ExportDialog.tsx          # ⌘E modal export dialog
    │   └── InspectorPanel.tsx        # Right panel (click node to open)
    │
    └── shared/
        └── AnimatedLayout.tsx        # Framer Motion transition wrapper
```

### Component Details

#### WelcomeScreen
- Full-canvas overlay when no project is active
- Shows existing projects as cards (name, MC version, loader, mod count)
- "Create New Pack" button opens inline form
- After selecting/creating project → transitions to graph view

#### AppShell
- Three-column layout: ModListPanel | GraphCanvas | InspectorPanel
- GraphCanvas is always rendered
- InspectorPanel is conditionally shown (animated slide-in from right)
- StatusBar at bottom

#### ModListPanel (240px left sidebar)
- **Project card** at top: name, MC version, loader, mod count
- **Mod list**: scrollable list, each item shows:
  - Left color bar (Mod=gold, Library=blue, API=purple, Loader=green)
  - Name + version number
  - Click → focus node in graph + open inspector
  - Right-click → context menu (remove, visit page)
- **"Add Mod" button** at bottom → opens SearchPanel
- **Diagnostics badge** if issues exist

#### GraphCanvas
- React Flow canvas, always visible
- **ModNode**: Info card style
  - Left color bar (3px) indicates node type
  - Type label (MOD/LIB/API/LOADER) + version
  - Name (prominent)
  - Dependency count
  - Selected state: accent ring + subtle glow
  - Conflict state: red border glow
- **DependencyEdge**: Three styles
  - Required: solid gray line with arrow
  - Optional: dashed lighter line
  - Incompatible: red dashed line with ⚠ icon
- **GraphControls**: Bottom-right floating buttons (zoom in/out, fit view, auto-layout)
- **Diagnostics badge**: Bottom-left, shows critical/warning counts
- **Empty state**: Loader node centered + "⌘K to add your first mod"

#### SearchPanel (⌘K)
- Floating overlay centered on graph
- Semi-transparent backdrop (graph dimmed but visible)
- Search input with instant results
- Each result shows: icon, name, author, description, downloads, MC version badge
- "Add" button → adds mod + auto-fetches dependencies → updates graph
- Close: Escape or ⌘K again

#### DiagnosticsPanel (⌘D)
- Slides up from bottom, covers ~40% of canvas height
- Graph dims but stays visible
- Issues grouped by severity (Critical / Warning / Info)
- Each issue: severity badge + title + affected mods + suggested fix
- Click issue → focus on affected node(s) in graph
- Close: Escape or ⌘D again

#### ExportDialog (⌘E)
- Modal overlay with backdrop
- Pre-flight diagnostic check (warn if critical issues)
- 4 format options: Modrinth Pack, CurseForge Pack, Prism Launcher, ZIP
- File path selector (Tauri dialog)
- Export progress + result

#### InspectorPanel (320px right)
- Opens when clicking a node (animated slide-in)
- Close button (✕) in header
- Shows all PRD-required fields:
  - Name, Type badge, Version
  - Description
  - Author
  - Dependencies (clickable → focus node)
  - Available Versions (dropdown selector)
  - Supported MC Versions
  - License
  - Homepage (link)
  - Repository (link)
  - Changelog (expandable)

## Data Flow

### Adding a Mod (Critical Path)

```
User clicks "Add" in SearchPanel
  → projectStore.addMod(modInfo)
    → tauri.addModToProject(projectId, modInfo)  // Save to DB
    → tauri.getModVersions(modId)                 // Fetch versions from Modrinth
    → Auto-select matching version (MC + Loader)
    → tauri.saveDependencies(modId, deps)         // Save deps to DB
  → Refresh graph
    → tauri.listProjectMods(projectId)
    → tauri.getAllDependencies(projectId)
    → dependencyResolver.resolve(mods, deps)      // Generate edges
    → graphLayout.calculate(nodes, edges)          // Dagre layout
    → Update React Flow nodes + edges
  → Run diagnostics
    → conflictDetector.detect(mods, deps)          // 5 checks
    → Update diagnostics badge
```

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| ⌘K | Open/close search panel |
| ⌘D | Open/close diagnostics panel |
| ⌘E | Open export dialog |
| ⌘F | Focus/search node in graph |
| Escape | Close any open panel |
| Delete | Remove selected mod (with confirmation) |

## Animation System (Framer Motion)

### Principles
- Duration: 150ms–250ms
- Prefer: spring animations, fade transitions, scale transitions
- Avoid: bounce, overshoot, excessive motion

### Specific Animations

| Element | Animation | Config |
|---------|-----------|--------|
| View transition (welcome → graph) | Fade + scale | `spring(1, 0.8, 0.2)` |
| Inspector slide-in | Slide from right + fade | `tween(200ms, ease-out)` |
| Search panel appear | Scale from 0.95 + fade | `spring(1, 0.7, 0.15)` |
| Diagnostics slide-up | Slide from bottom | `tween(250ms, ease-out)` |
| Node hover | Scale 1.02 + border glow | `tween(150ms)` |
| Node select | Ring appear + subtle pulse | `spring(1, 0.5, 0.1)` |
| Edge highlight | Opacity + width change | `tween(150ms)` |
| Panel close | Reverse of open animation | Same config |
| Mod list item hover | Background fade | `tween(100ms)` |

## Rust Backend Fixes

### Export System (Currently Empty Shell)

All 4 exporters need to:
1. Fetch actual download URLs from Modrinth/CurseForge APIs
2. Compute file hashes (SHA1/SHA512)
3. Create proper ZIP archives with correct structure
4. Write valid manifest/metadata files

**Modrinth Pack (.mrpack)**:
- `modrinth.index.json` with `files[].downloads`, `files[].hashes`
- `overrides/` directory for config files
- Proper ZIP compression

**CurseForge Pack**:
- `manifest.json` with correct `projectID`/`fileID` pairs
- `modlist.html` with mod links
- ZIP with proper structure

**Prism Launcher**:
- `mmc-pack.json` with component definitions
- `instance.cfg` with settings
- `mods/` directory structure

**ZIP Archive**:
- All mod jars + manifest + README
- Proper ZIP64 for large packs

### Dependency Auto-Fetch

New command: `fetch_and_save_dependencies`
- Takes modrinth_id + mc_version + loader
- Calls Modrinth API for version list
- Selects the latest version that matches both mc_version AND loader
- If no exact match, selects the latest version matching mc_version (log warning)
- Extracts dependency list from version data (required, optional, incompatible types)
- Saves to dependencies table with dep_type classification
- Returns the dependency list

### Search Enhancement

- Add CurseForge API support (optional for MVP, Modrinth is sufficient)
- Return dependency info in search results for preview

## Diagnostic Engine (5 Checks)

| Check | Implementation |
|-------|---------------|
| Missing dependencies | Check all required deps have corresponding mods in project |
| Version mismatch | Compare each mod's supported MC versions against project MC version |
| Incompatible mods | Check Modrinth `incompatible` dependency type + known incompatibility list |
| Duplicate functionality | Group mods by category tags, flag overlaps |
| Loader conflicts | Verify all mods support the project's loader |

Severity levels:
- **Critical**: Missing required dep, loader conflict, known incompatibility
- **Warning**: Version mismatch, duplicate functionality
- **Info**: Optional dep missing, newer version available

Each diagnostic provides:
- Explanation text
- Affected mod list
- Suggested fix (actionable)

## Design Language Compliance

### Color System (from PRD)
- Background: `#09090B`
- Surface: `#111113`
- Elevated: `#18181B`
- Primary text: `#FAFAFA`
- Secondary text: `#A1A1AA`
- Accent: `#D4A017`
- Danger: `#EF4444`
- Warning: `#F59E0B`
- Success: `#22C55E`

### Node Type Colors
- Mod: `#D4A017` (accent gold)
- Library: `#3B82F6` (blue)
- API: `#8B5CF6` (purple)
- Loader: `#22C55E` (green)

### Typography
- Headings: SF Pro Display / Inter Tight
- Body: Inter
- Data/monospace: JetBrains Mono

### Layout
- Sidebar: 240px
- Inspector: 320px (conditional)
- Canvas: flexible
- Grid: 8px base spacing

## What We Keep from Current Code

- `src-tauri/` Rust backend (with export fixes)
- `src/types.ts` (extend, not replace)
- `src/lib/tauri.ts` mock layer pattern
- `src/engine/graphLayout.ts` Dagre integration
- `src/engine/dependencyResolver.ts` (extend for version compat)
- `src/stores/projectStore.ts` CRUD logic (refactor, not rewrite)
- `package.json` dependencies
- `src-tauri/tauri.conf.json` (with withGlobalTauri)
- `index.html` (with font loading)

## What We Delete and Rewrite

- All components in `src/components/` (new architecture)
- `src/App.tsx` (new layout shell)
- `src/stores/uiStore.ts` (new panel state model)
- `src/stores/graphStore.ts` (fix edge generation)
- `src/engine/conflictDetector.ts` (expand to 5 checks)
- `src/hooks/useModrinth.ts` (add version selection)
- `src/styles.css` (add animation system)
