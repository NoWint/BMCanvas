# ModCanvas MVP Design

Date: 2026-06-12

## Overview

ModCanvas is a professional visual development environment for Minecraft modpack creators. MVP (v0.1) delivers: project management, mod search (Modrinth), dependency graph visualization, conflict detection, and multi-format export.

**Architecture**: Thin Rust shell — Rust handles I/O, SQLite, HTTP, and export; all business logic (dependency resolution, graph layout, conflict detection) runs in the frontend.

**Development mode**: Vibecoding (solo + AI), vertical-slice-first strategy.

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                   React Frontend                 │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Project  │ │  Graph   │ │   Diagnostics    │ │
│  │ Manager  │ │  Canvas  │ │     Engine        │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │  Search  │ │Inspector │ │  Export Builder   │ │
│  │  Panel   │ │  Panel   │ │                   │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
│         Zustand Store · TanStack Query           │
└──────────────────────┬──────────────────────────┘
                       │ Tauri IPC (invoke / events)
┌──────────────────────┴──────────────────────────┐
│                   Rust Core                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │
│  │ Project  │ │  Modrinth│ │     Export       │ │
│  │  Store   │ │  Client  │ │     Engine       │ │
│  │ (SQLite) │ │  (HTTP)  │ │  (.mrpack/zip)  │ │
│  └──────────┘ └──────────┘ └──────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Responsibility Split

| Layer | Responsibilities |
|---|---|
| **React Frontend** | All UI, state management, dependency resolution logic, graph layout (dagre/elkjs), conflict detection rules, user interaction |
| **Rust Backend** | SQLite read/write, Modrinth API HTTP requests, project file management, export file generation, filesystem operations |
| **IPC Boundary** | Frontend calls Rust via `invoke`; Rust pushes events via `emit` (search progress, export progress) |

### Why Modrinth API goes through Rust proxy

1. **CORS**: Frontend direct calls to third-party APIs may have CORS issues in Tauri webview
2. **Caching**: Rust manages SQLite cache centrally, reducing duplicate requests
3. **Rate limiting**: Rust handles API rate limiting uniformly

---

## Data Model

### SQLite Schema

```sql
CREATE TABLE projects (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL,
    description TEXT DEFAULT '',
    mc_version  TEXT NOT NULL,
    loader      TEXT NOT NULL,  -- "forge" | "neoforge" | "fabric" | "quilt"
    author      TEXT DEFAULT '',
    tags        TEXT DEFAULT '[]',
    created_at  INTEGER NOT NULL,
    updated_at  INTEGER NOT NULL
);

CREATE TABLE project_mods (
    id              TEXT PRIMARY KEY,
    project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    modrinth_id     TEXT,
    slug            TEXT,
    name            TEXT NOT NULL,
    version_id      TEXT,
    version_number  TEXT,
    icon_url        TEXT,
    description     TEXT,
    author          TEXT,
    source_url      TEXT,
    license         TEXT,
    added_at        INTEGER NOT NULL
);

CREATE TABLE dependencies (
    id              TEXT PRIMARY KEY,
    project_mod_id  TEXT NOT NULL REFERENCES project_mods(id) ON DELETE CASCADE,
    depends_on_slug TEXT NOT NULL,
    dep_type        TEXT NOT NULL,  -- "required" | "optional" | "incompatible"
    dep_modrinth_id TEXT
);

CREATE TABLE mod_cache (
    modrinth_id  TEXT PRIMARY KEY,
    slug         TEXT,
    name         TEXT,
    description  TEXT,
    icon_url     TEXT,
    author       TEXT,
    downloads    INTEGER,
    categories   TEXT DEFAULT '[]',
    loaders      TEXT DEFAULT '[]',
    versions     TEXT DEFAULT '[]',
    cached_at    INTEGER NOT NULL
);
```

### Project File Structure

```
~/ModCanvas/Projects/
└── <project-id>/
    └── project.json
```

Export files are generated to user-chosen directories, not inside project directories.

---

## Frontend Architecture

### Directory Structure

```
src/
├── main.tsx
├── App.tsx
├── stores/
│   ├── projectStore.ts
│   ├── graphStore.ts
│   └── uiStore.ts
├── hooks/
│   ├── useModrinth.ts
│   ├── useProject.ts
│   └── useDiagnostics.ts
├── engine/
│   ├── dependencyResolver.ts
│   ├── conflictDetector.ts
│   └── graphLayout.ts
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx
│   │   ├── Canvas.tsx
│   │   └── Inspector.tsx
│   ├── project/
│   │   ├── ProjectList.tsx
│   │   └── ProjectCreate.tsx
│   ├── search/
│   │   ├── SearchBar.tsx
│   │   └── SearchResults.tsx
│   ├── graph/
│   │   ├── GraphCanvas.tsx
│   │   ├── ModNode.tsx
│   │   ├── DependencyEdge.tsx
│   │   └── GraphControls.tsx
│   ├── diagnostics/
│   │   └── DiagnosticsPanel.tsx
│   └── export/
│       └── ExportDialog.tsx
└── lib/
    └── tauri.ts
```

### State Management

| Store | Responsibility | Key State |
|---|---|---|
| `projectStore` | Current project and mod list | `currentProject`, `mods[]`, `addMod()`, `removeMod()` |
| `graphStore` | Graph nodes/edges/layout | `nodes[]`, `edges[]`, `layout()`, `focusNode()`, `collapseSubtree()` |
| `uiStore` | UI toggle state | `activeView`, `inspectorOpen`, `selectedNodeId` |

### Key Interaction Flow: Adding a Mod

1. User searches → TanStack Query caches Modrinth results
2. Click "Add" → `projectStore.addMod()` updates state
3. `dependencyResolver` automatically resolves direct dependencies
4. `graphStore` recalculates layout, updates nodes/edges
5. `conflictDetector` runs automatically, updates diagnostics panel

---

## Dependency Graph (Signature Feature)

### Node Design

```
┌─────────────────────────┐
│  icon  ModName          │  ← icon + name
│  v0.5.1f · Fabric       │  ← version + loader
│  ● ● ●                  │  ← dependency count indicator
└─────────────────────────┘
```

### Node Type Visual Distinction

| Type | Left Border Color | Description |
|---|---|---|
| Mod | #D4A017 (gold) | Regular mod |
| Library | #007AFF (blue) | Library/dependency |
| API | #8B5CF6 (purple) | API mod |
| Loader | #34C759 (green) | Loader (Forge/Fabric etc.) |

### Edge Design

| Type | Style | Color |
|---|---|---|
| Required | Solid + arrow | #8E8E93 |
| Optional | Dashed + arrow | #AEAEB2 |
| Incompatible | Red dashed + ✕ | #FF3B30 |

### Interaction Capabilities

- **Drag/Zoom/Pan**: React Flow built-in
- **Auto Layout**: dagre algorithm, left-to-right layering (Loader → API → Library → Mod)
- **Search & Focus**: Type keyword → matching nodes highlight + viewport pans to node
- **Collapse Subtree**: Double-click node to collapse/expand all dependencies; collapsed state shows dependency count badge
- **Click Node**: Inspector panel shows details

### Graph Auto-Update

On every `projectStore.mods` change:
1. `dependencyResolver` recalculates dependencies
2. `conflictDetector` rechecks conflicts
3. `graphLayout` relayouts (incremental update, preserving user manual adjustments)

---

## Rust Backend

### IPC Commands

```rust
// Project management
fn create_project(metadata: ProjectInput) -> Result<Project>
fn list_projects() -> Result<Vec<Project>>
fn get_project(id: String) -> Result<Project>
fn update_project(id: String, data: ProjectInput) -> Result<Project>
fn delete_project(id: String) -> Result<()>

// Mod management
fn add_mod_to_project(project_id: String, mod_data: ModInput) -> Result<ProjectMod>
fn remove_mod_from_project(project_id: String, mod_id: String) -> Result<()>
fn list_project_mods(project_id: String) -> Result<Vec<ProjectMod>>

// Modrinth API proxy
fn search_mods(query: String, filters: SearchFilters) -> Result<SearchResult>
fn get_mod_details(modrinth_id: String) -> Result<ModDetails>
fn get_mod_versions(modrinth_id: String, mc_version: String, loader: String) -> Result<Vec<ModVersion>>

// Dependencies
fn save_dependencies(mod_id: String, deps: Vec<DepInput>) -> Result<()>
fn get_dependencies(mod_id: String) -> Result<Vec<Dependency>>

// Export
fn export_pack(project_id: String, format: ExportFormat, output_path: String) -> Result<ExportResult>
```

### Module Structure

```
src-tauri/src/
├── main.rs
├── commands/
│   ├── project.rs
│   ├── mods.rs
│   ├── search.rs
│   └── export.rs
├── db/
│   ├── mod.rs
│   └── migrations.rs
├── modrinth/
│   ├── client.rs
│   └── types.rs
└── export/
    ├── modrinth_pack.rs
    ├── curseforge_pack.rs
    ├── prism.rs
    └── zip.rs
```

---

## UI Layout & Design Language

### Layout

Three-column: Sidebar 240px + Canvas flexible + Inspector 320px

### Design Language: Industrial Minimalism — Light Edition

**Color System (Apple SwiftUI white hierarchy)**:

| Purpose | Value | Note |
|---|---|---|
| Main Background | #F2F2F7 | systemGroupedBackground |
| Surface (cards/panels) | #FFFFFF | secondarySystemGroupedBackground |
| Elevated Surface | #FFFFFF + shadow | White + subtle shadow |
| Separator | #C6C6C8 | separator |
| Primary Text | #1C1C1E | labelColor |
| Secondary Text | #8E8E93 | secondaryLabelColor |
| Tertiary Text | #AEAEB2 | tertiaryLabelColor |
| Accent | #D4A017 | Gold (brand identity) |
| Alt Accent | #FFCC66 | Light gold |
| Danger | #FF3B30 | systemRed |
| Warning | #FF9500 | systemOrange |
| Success | #34C759 | systemGreen |
| Info | #007AFF | systemBlue |

**Visual Hierarchy**:
- Sidebar: #F2F2F7 background, no shadow
- Canvas: #F2F2F7 background, content in white cards
- Inspector: #FFFFFF white panel, left thin line separator
- Nodes: White card + left colored border strip (by type) + subtle shadow

**Typography**:
- Headings: SF Pro Display / Inter Tight
- Body: Inter
- Data/Code: JetBrains Mono

**Motion**:
- Duration: 150-250ms
- Spring animations + Fade/Scale transitions
- No Bounce/Overshoot/Excessive motion

### Sidebar View Switching

| Nav | Canvas Content | Inspector Content |
|---|---|---|
| Projects | Project list / create form | Project details |
| Discover | Search results | Mod preview |
| Graph | Dependency graph | Selected node details |
| Diagnostics | Conflict/issue list | Issue details + fix suggestion |
| Export | Export config panel | Export preview |

---

## Conflict Detection Engine

### Detection Rules

```typescript
interface Diagnostic {
  id: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'version_mismatch' | 'loader_mismatch' | 'missing_dependency' | 'known_incompatibility';
  title: string;
  description: string;
  affectedMods: string[];
  suggestedFix: string;
}
```

| Detection Type | Logic | Severity |
|---|---|---|
| Loader mismatch | Mod's supported loaders don't include project loader | Critical |
| MC version mismatch | Mod's supported versions don't include project mc_version | Critical |
| Missing required dependency | A mod's required dependency not in project mod list | Warning |
| Known incompatibility | Hardcoded conflict pairs (e.g. Optifine ↔ Sodium) | Warning |
| Duplicate functionality | Multiple mods in same category (e.g. multiple optimization mods) | Info |

### Known Incompatibilities (MVP hardcoded)

```typescript
const KNOWN_INCOMPATIBILITIES = [
  { mod1: 'optifine', mod2: 'sodium', reason: 'Rendering pipeline incompatibility' },
  { mod1: 'optifine', mod2: 'lithium', reason: 'Potential game logic conflicts' },
  { mod1: 'rubidium', mod2: 'embeddium', reason: 'Both are Sodium ports, redundant' },
];
```

### Trigger Timing

- Auto-run on add/remove mod
- Auto-run on project MC version/Loader change
- Manual trigger via Diagnostics panel refresh button

---

## Export System

### Export Formats

| Format | Generated Content | Extension |
|---|---|---|
| Modrinth Pack | modrinth.index.json + mods/ | .mrpack |
| CurseForge Pack | manifest.json + modlist.html + mods/ | .zip |
| Prism Launcher | mmc-pack.json + instance.cfg + mods/ | folder |
| ZIP Archive | mods/ + config/ + README.md | .zip |

### Export Flow

1. User selects format + output path
2. Frontend sends `export_pack` IPC command
3. Rust: reads project mods from SQLite → calls Modrinth API for download URLs → downloads mod jars to temp dir → assembles manifest/metadata per format spec → packages final file
4. Rust pushes progress events (download progress, packaging progress)
5. Frontend notifies user on completion

---

## Vertical Slice Plan

### Slice 1: Skeleton + Project System
- Tauri v2 project initialization
- Three-column layout (Sidebar + Canvas + Inspector)
- Project CRUD (create/list/delete)
- SQLite integration
- **Acceptance**: Can create projects and see project list

### Slice 2: Mod Search
- Modrinth search API integration
- Search panel + results list
- One-click add mod to project
- **Acceptance**: Can search mods and add to project

### Slice 3: Dependency Graph
- React Flow integration
- Node/edge rendering
- dagre auto layout
- Search & focus + collapse subtree
- Inspector panel with mod details
- **Acceptance**: Can see and interact with dependency graph

### Slice 4: Conflict Detection
- Conflict detection engine implementation
- Diagnostics panel
- Conflict markers on graph (red edges/nodes)
- **Acceptance**: Can auto-detect and display conflicts

### Slice 5: Export
- 4 export format implementations
- Export progress feedback
- **Acceptance**: Can export complete modpack

---

## Key Decisions Summary

| Decision | Choice | Rationale |
|---|---|---|
| Architecture | Thin Rust shell | Fastest iteration for vibecoding; JS ecosystem has mature graph/layout libs |
| API Source | Modrinth only (MVP) | Public API, no key needed; CurseForge added later |
| Dependency Depth | Direct only (MVP) | Sufficient for MVP; transitive deps in future version |
| Graph Layout | dagre (frontend) | Mature JS lib, integrates with React Flow |
| Data Storage | SQLite | Per PRD; Rust-side management |
| Color Theme | Apple SwiftUI light hierarchy | User preference; white-based professional feel |
| Dev Strategy | Vertical slice first | Fastest path to working product |
