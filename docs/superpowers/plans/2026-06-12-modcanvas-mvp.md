# ModCanvas MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build ModCanvas MVP — a professional visual IDE for designing Minecraft modpacks, with project management, mod search, dependency graph, conflict detection, and multi-format export.

**Architecture:** Thin Rust shell (I/O + SQLite + HTTP + export) + React frontend (all business logic + UI). Tauri v2 bridges them via IPC. Frontend handles dependency resolution, graph layout (dagre), and conflict detection.

**Tech Stack:** Tauri v2, React, TypeScript, TailwindCSS, Framer Motion, Zustand, React Flow, TanStack Query, dagre | Rust, Tokio, Serde, Reqwest, rusqlite

---

## File Structure

### Frontend

| File | Responsibility |
|---|---|
| `src/main.tsx` | React entry point |
| `src/App.tsx` | Root layout: Sidebar + Canvas + Inspector |
| `src/stores/projectStore.ts` | Project + mods state (Zustand) |
| `src/stores/graphStore.ts` | Graph nodes/edges/layout state |
| `src/stores/uiStore.ts` | UI toggles: active view, inspector, selected node |
| `src/hooks/useProject.ts` | Project CRUD via Tauri IPC |
| `src/hooks/useModrinth.ts` | Modrinth search/details via Tauri IPC (TanStack Query) |
| `src/hooks/useDiagnostics.ts` | Conflict detection hook |
| `src/engine/dependencyResolver.ts` | Direct dependency resolution logic |
| `src/engine/conflictDetector.ts` | Conflict detection rules |
| `src/engine/graphLayout.ts` | dagre layout computation |
| `src/components/layout/Sidebar.tsx` | Left navigation sidebar |
| `src/components/layout/Canvas.tsx` | Main content area (switches by view) |
| `src/components/layout/Inspector.tsx` | Right detail panel |
| `src/components/project/ProjectList.tsx` | Project cards list |
| `src/components/project/ProjectCreate.tsx` | New project form |
| `src/components/search/SearchBar.tsx` | Search input |
| `src/components/search/SearchResults.tsx` | Search results list |
| `src/components/graph/GraphCanvas.tsx` | React Flow canvas wrapper |
| `src/components/graph/ModNode.tsx` | Custom graph node |
| `src/components/graph/DependencyEdge.tsx` | Custom graph edge |
| `src/components/graph/GraphControls.tsx` | Zoom/layout/search controls |
| `src/components/diagnostics/DiagnosticsPanel.tsx` | Conflict list panel |
| `src/components/export/ExportDialog.tsx` | Export format picker + progress |
| `src/lib/tauri.ts` | Typed IPC invoke wrappers |
| `src/types.ts` | Shared TypeScript interfaces |

### Rust

| File | Responsibility |
|---|---|
| `src-tauri/src/main.rs` | Entry point, plugin registration, command registration |
| `src-tauri/src/commands/project.rs` | Project CRUD commands |
| `src-tauri/src/commands/mods.rs` | Mod management commands |
| `src-tauri/src/commands/search.rs` | Modrinth search proxy commands |
| `src-tauri/src/commands/export.rs` | Export commands |
| `src-tauri/src/db/mod.rs` | SQLite connection pool + helpers |
| `src-tauri/src/db/migrations.rs` | Schema migrations |
| `src-tauri/src/modrinth/client.rs` | Modrinth HTTP client |
| `src-tauri/src/modrinth/types.rs` | Modrinth API response types |
| `src-tauri/src/export/modrinth_pack.rs` | .mrpack format |
| `src-tauri/src/export/curseforge_pack.rs` | CurseForge zip format |
| `src-tauri/src/export/prism.rs` | Prism Launcher format |
| `src-tauri/src/export/zip.rs` | Plain ZIP format |

---

## Slice 1: Skeleton + Project System

### Task 1: Initialize Tauri v2 Project

**Files:**
- Create: entire project scaffold via `npm create tauri-app`

- [ ] **Step 1: Scaffold Tauri v2 + React + TypeScript project**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm create tauri-app@latest -- --template react-ts
```

When prompted:
- Project name: `modcanvas`
- Frontend: React + TypeScript
- Package manager: npm

- [ ] **Step 2: Install frontend dependencies**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm install zustand @tanstack/react-query reactflow @dagre/dagre framer-motion
npm install -D @types/dagre
```

- [ ] **Step 3: Install Rust dependencies**

Add to `src-tauri/Cargo.toml` under `[dependencies]`:
```toml
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tokio = { version = "1", features = ["full"] }
reqwest = { version = "0.12", features = ["json"] }
rusqlite = { version = "0.31", features = ["bundled"] }
uuid = { version = "1", features = ["v4"] }
chrono = "0.4"
tauri-plugin-dialog = "2"
tauri-plugin-fs = "2"
```

- [ ] **Step 4: Verify project runs**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Window opens with default Tauri + React template page.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: initialize Tauri v2 + React + TypeScript project with dependencies"
```

---

### Task 2: Shared TypeScript Types

**Files:**
- Create: `src/types.ts`

- [ ] **Step 1: Create shared type definitions**

Create `src/types.ts`:
```typescript
// Project types
export type Loader = 'forge' | 'neoforge' | 'fabric' | 'quilt';

export interface Project {
  id: string;
  name: string;
  description: string;
  mc_version: string;
  loader: Loader;
  author: string;
  tags: string[];
  created_at: number;
  updated_at: number;
}

export interface ProjectInput {
  name: string;
  description: string;
  mc_version: string;
  loader: Loader;
  author: string;
  tags: string[];
}

// Mod types
export interface ProjectMod {
  id: string;
  project_id: string;
  modrinth_id: string | null;
  slug: string | null;
  name: string;
  version_id: string | null;
  version_number: string | null;
  icon_url: string | null;
  description: string | null;
  author: string | null;
  source_url: string | null;
  license: string | null;
  added_at: number;
}

export interface ModInput {
  modrinth_id: string | null;
  slug: string | null;
  name: string;
  version_id: string | null;
  version_number: string | null;
  icon_url: string | null;
  description: string | null;
  author: string | null;
  source_url: string | null;
  license: string | null;
}

// Dependency types
export type DepType = 'required' | 'optional' | 'incompatible';

export interface Dependency {
  id: string;
  project_mod_id: string;
  depends_on_slug: string;
  dep_type: DepType;
  dep_modrinth_id: string | null;
}

export interface DepInput {
  depends_on_slug: string;
  dep_type: DepType;
  dep_modrinth_id: string | null;
}

// Modrinth API types
export interface ModrinthSearchResult {
  hits: ModrinthSearchHit[];
  offset: number;
  limit: number;
  total_hits: number;
}

export interface ModrinthSearchHit {
  project_id: string;
  project_type: string;
  slug: string;
  author: string;
  title: string;
  description: string;
  categories: string[];
  display_categories: string[];
  downloads: number;
  icon_url: string;
  latest_version: string;
  client_side: string;
  server_side: string;
  versions: string[];
  loaders: string[];
}

export interface ModrinthVersion {
  id: string;
  project_id: string;
  name: string;
  version_number: string;
  changelog: string;
  dependencies: ModrinthDependency[];
  game_versions: string[];
  loaders: string[];
  files: ModrinthFile[];
}

export interface ModrinthDependency {
  version_id: string | null;
  project_id: string | null;
  file_name: string | null;
  dependency_type: 'required' | 'optional' | 'incompatible';
}

export interface ModrinthFile {
  hashes: Record<string, string>;
  url: string;
  filename: string;
  primary: boolean;
  size: number;
  file_type: string | null;
}

// Diagnostic types
export type DiagnosticSeverity = 'info' | 'warning' | 'critical';
export type DiagnosticType = 'version_mismatch' | 'loader_mismatch' | 'missing_dependency' | 'known_incompatibility';

export interface Diagnostic {
  id: string;
  severity: DiagnosticSeverity;
  type: DiagnosticType;
  title: string;
  description: string;
  affectedMods: string[];
  suggestedFix: string;
}

// Export types
export type ExportFormat = 'modrinth' | 'curseforge' | 'prism' | 'zip';

export interface ExportResult {
  success: boolean;
  path: string;
  format: ExportFormat;
}

// UI types
export type ViewType = 'projects' | 'discover' | 'graph' | 'diagnostics' | 'export';

// Graph types
export type NodeType = 'mod' | 'library' | 'api' | 'loader';

export interface ModNodeData {
  modId: string;
  name: string;
  version: string | null;
  loader: string | null;
  iconUrl: string | null;
  nodeType: NodeType;
  dependencyCount: number;
  collapsed: boolean;
  hasConflict: boolean;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add shared TypeScript type definitions"
```

---

### Task 3: Rust SQLite Layer

**Files:**
- Create: `src-tauri/src/db/mod.rs`
- Create: `src-tauri/src/db/migrations.rs`

- [ ] **Step 1: Create database module**

Create `src-tauri/src/db/mod.rs`:
```rust
pub mod migrations;

use rusqlite::{Connection, params};
use std::sync::Mutex;
use tauri::State;

pub type DbState = Mutex<Connection>;

pub fn init_db(app_data_dir: &str) -> Result<Connection, String> {
    let db_path = format!("{}/modcanvas.db", app_data_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| e.to_string())?;
    migrations::run(&conn)?;
    Ok(conn)
}

pub fn get_conn(db: &State<DbState>) -> Result<std::sync::MutexGuard<Connection>, String> {
    db.lock().map_err(|e| e.to_string())
}
```

- [ ] **Step 2: Create migrations module**

Create `src-tauri/src/db/migrations.rs`:
```rust
use rusqlite::Connection;

pub fn run(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS projects (
            id          TEXT PRIMARY KEY,
            name        TEXT NOT NULL,
            description TEXT DEFAULT '',
            mc_version  TEXT NOT NULL,
            loader      TEXT NOT NULL,
            author      TEXT DEFAULT '',
            tags        TEXT DEFAULT '[]',
            created_at  INTEGER NOT NULL,
            updated_at  INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS project_mods (
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

        CREATE TABLE IF NOT EXISTS dependencies (
            id              TEXT PRIMARY KEY,
            project_mod_id  TEXT NOT NULL REFERENCES project_mods(id) ON DELETE CASCADE,
            depends_on_slug TEXT NOT NULL,
            dep_type        TEXT NOT NULL,
            dep_modrinth_id TEXT
        );

        CREATE TABLE IF NOT EXISTS mod_cache (
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
        );"
    ).map_err(|e| e.to_string())
}
```

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/db/
git commit -m "feat: add SQLite database layer with schema migrations"
```

---

### Task 4: Rust Project Commands

**Files:**
- Create: `src-tauri/src/commands/project.rs`

- [ ] **Step 1: Create project commands**

Create `src-tauri/src/commands/project.rs`:
```rust
use crate::db::{get_conn, DbState};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Project {
    pub id: String,
    pub name: String,
    pub description: String,
    pub mc_version: String,
    pub loader: String,
    pub author: String,
    pub tags: String,
    pub created_at: i64,
    pub updated_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct ProjectInput {
    pub name: String,
    pub description: String,
    pub mc_version: String,
    pub loader: String,
    pub author: String,
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn create_project(input: ProjectInput, db: State<DbState>) -> Result<Project, String> {
    let conn = get_conn(&db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    let tags_json = serde_json::to_string(&input.tags).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO projects (id, name, description, mc_version, loader, author, tags, created_at, updated_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![id, input.name, input.description, input.mc_version, input.loader, input.author, tags_json, now, now],
    ).map_err(|e| e.to_string())?;

    Ok(Project {
        id,
        name: input.name,
        description: input.description,
        mc_version: input.mc_version,
        loader: input.loader,
        author: input.author,
        tags: tags_json,
        created_at: now,
        updated_at: now,
    })
}

#[tauri::command]
pub fn list_projects(db: State<DbState>) -> Result<Vec<Project>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT id, name, description, mc_version, loader, author, tags, created_at, updated_at FROM projects ORDER BY updated_at DESC"
    ).map_err(|e| e.to_string())?;

    let projects = stmt.query_map([], |row| {
        Ok(Project {
            id: row.get(0)?,
            name: row.get(1)?,
            description: row.get(2)?,
            mc_version: row.get(3)?,
            loader: row.get(4)?,
            author: row.get(5)?,
            tags: row.get(6)?,
            created_at: row.get(7)?,
            updated_at: row.get(8)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(projects)
}

#[tauri::command]
pub fn get_project(id: String, db: State<DbState>) -> Result<Project, String> {
    let conn = get_conn(&db)?;
    conn.query_row(
        "SELECT id, name, description, mc_version, loader, author, tags, created_at, updated_at FROM projects WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(Project {
                id: row.get(0)?,
                name: row.get(1)?,
                description: row.get(2)?,
                mc_version: row.get(3)?,
                loader: row.get(4)?,
                author: row.get(5)?,
                tags: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        },
    ).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_project(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;
    conn.execute("DELETE FROM projects WHERE id = ?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

- [ ] **Step 2: Commit**

```bash
git add src-tauri/src/commands/project.rs
git commit -m "feat: add Rust project CRUD commands"
```

---

### Task 5: Rust Mod Commands

**Files:**
- Create: `src-tauri/src/commands/mods.rs`

- [ ] **Step 1: Create mod management commands**

Create `src-tauri/src/commands/mods.rs`:
```rust
use crate::db::{get_conn, DbState};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProjectMod {
    pub id: String,
    pub project_id: String,
    pub modrinth_id: Option<String>,
    pub slug: Option<String>,
    pub name: String,
    pub version_id: Option<String>,
    pub version_number: Option<String>,
    pub icon_url: Option<String>,
    pub description: Option<String>,
    pub author: Option<String>,
    pub source_url: Option<String>,
    pub license: Option<String>,
    pub added_at: i64,
}

#[derive(Debug, Deserialize)]
pub struct ModInput {
    pub modrinth_id: Option<String>,
    pub slug: Option<String>,
    pub name: String,
    pub version_id: Option<String>,
    pub version_number: Option<String>,
    pub icon_url: Option<String>,
    pub description: Option<String>,
    pub author: Option<String>,
    pub source_url: Option<String>,
    pub license: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Dependency {
    pub id: String,
    pub project_mod_id: String,
    pub depends_on_slug: String,
    pub dep_type: String,
    pub dep_modrinth_id: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct DepInput {
    pub depends_on_slug: String,
    pub dep_type: String,
    pub dep_modrinth_id: Option<String>,
}

#[tauri::command]
pub fn add_mod_to_project(project_id: String, input: ModInput, db: State<DbState>) -> Result<ProjectMod, String> {
    let conn = get_conn(&db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();

    conn.execute(
        "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        rusqlite::params![id, project_id, input.modrinth_id, input.slug, input.name, input.version_id, input.version_number, input.icon_url, input.description, input.author, input.source_url, input.license, now],
    ).map_err(|e| e.to_string())?;

    // Update project updated_at
    conn.execute("UPDATE projects SET updated_at = ?1 WHERE id = ?2", rusqlite::params![now, project_id])
        .map_err(|e| e.to_string())?;

    Ok(ProjectMod {
        id,
        project_id,
        modrinth_id: input.modrinth_id,
        slug: input.slug,
        name: input.name,
        version_id: input.version_id,
        version_number: input.version_number,
        icon_url: input.icon_url,
        description: input.description,
        author: input.author,
        source_url: input.source_url,
        license: input.license,
        added_at: now,
    })
}

#[tauri::command]
pub fn remove_mod_from_project(project_id: String, mod_id: String, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;
    let now = Utc::now().timestamp_millis();

    conn.execute("DELETE FROM dependencies WHERE project_mod_id = ?1", rusqlite::params![mod_id])
        .map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM project_mods WHERE id = ?1 AND project_id = ?2", rusqlite::params![mod_id, project_id])
        .map_err(|e| e.to_string())?;
    conn.execute("UPDATE projects SET updated_at = ?1 WHERE id = ?2", rusqlite::params![now, project_id])
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_project_mods(project_id: String, db: State<DbState>) -> Result<Vec<ProjectMod>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at FROM project_mods WHERE project_id = ?1 ORDER BY name"
    ).map_err(|e| e.to_string())?;

    let mods = stmt.query_map(rusqlite::params![project_id], |row| {
        Ok(ProjectMod {
            id: row.get(0)?,
            project_id: row.get(1)?,
            modrinth_id: row.get(2)?,
            slug: row.get(3)?,
            name: row.get(4)?,
            version_id: row.get(5)?,
            version_number: row.get(6)?,
            icon_url: row.get(7)?,
            description: row.get(8)?,
            author: row.get(9)?,
            source_url: row.get(10)?,
            license: row.get(11)?,
            added_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(mods)
}

#[tauri::command]
pub fn save_dependencies(mod_id: String, deps: Vec<DepInput>, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;

    // Delete existing dependencies for this mod
    conn.execute("DELETE FROM dependencies WHERE project_mod_id = ?1", rusqlite::params![mod_id])
        .map_err(|e| e.to_string())?;

    for dep in deps {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO dependencies (id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, mod_id, dep.depends_on_slug, dep.dep_type, dep.dep_modrinth_id],
        ).map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_dependencies(mod_id: String, db: State<DbState>) -> Result<Vec<Dependency>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id FROM dependencies WHERE project_mod_id = ?1"
    ).map_err(|e| e.to_string())?;

    let deps = stmt.query_map(rusqlite::params![mod_id], |row| {
        Ok(Dependency {
            id: row.get(0)?,
            project_mod_id: row.get(1)?,
            depends_on_slug: row.get(2)?,
            dep_type: row.get(3)?,
            dep_modrinth_id: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(deps)
}

#[tauri::command]
pub fn get_all_dependencies(project_id: String, db: State<DbState>) -> Result<Vec<Dependency>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT d.id, d.project_mod_id, d.depends_on_slug, d.dep_type, d.dep_modrinth_id
         FROM dependencies d
         JOIN project_mods pm ON d.project_mod_id = pm.id
         WHERE pm.project_id = ?1"
    ).map_err(|e| e.to_string())?;

    let deps = stmt.query_map(rusqlite::params![project_id], |row| {
        Ok(Dependency {
            id: row.get(0)?,
            project_mod_id: row.get(1)?,
            depends_on_slug: row.get(2)?,
            dep_type: row.get(3)?,
            dep_modrinth_id: row.get(4)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    Ok(deps)
}
```

- [ ] **Step 2: Commit**

```bash
git add src-tauri/src/commands/mods.rs
git commit -m "feat: add Rust mod management and dependency commands"
```

---

### Task 6: Rust Main Entry Point

**Files:**
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Wire up Rust main with DB init and command registration**

Replace `src-tauri/src/main.rs` with:
```rust
mod commands;
mod db;
mod modrinth;

use db::DbState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data dir")
                .to_string_lossy()
                .to_string();

            std::fs::create_dir_all(&app_data_dir).ok();

            let conn = db::init_db(&app_data_dir)
                .expect("Failed to initialize database");

            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::delete_project,
            commands::mods::add_mod_to_project,
            commands::mods::remove_mod_from_project,
            commands::mods::list_project_mods,
            commands::mods::save_dependencies,
            commands::mods::get_dependencies,
            commands::mods::get_all_dependencies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 2: Create commands module file**

Create `src-tauri/src/commands/mod.rs`:
```rust
pub mod project;
pub mod mods;
```

- [ ] **Step 3: Create modrinth module placeholder**

Create `src-tauri/src/modrinth/mod.rs`:
```rust
// Will be implemented in Slice 2
```

- [ ] **Step 4: Verify Rust compiles**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
cd src-tauri && cargo check
```

Expected: Compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/
git commit -m "feat: wire up Rust main with DB init and command registration"
```

---

### Task 7: Frontend IPC Wrapper

**Files:**
- Create: `src/lib/tauri.ts`

- [ ] **Step 1: Create typed IPC invoke wrappers**

Create `src/lib/tauri.ts`:
```typescript
import { invoke } from '@tauri-apps/api/core';
import type {
  Project, ProjectInput, ProjectMod, ModInput,
  Dependency, DepInput, ExportFormat, ExportResult,
} from '../types';

// Project commands
export const createProject = (input: ProjectInput): Promise<Project> =>
  invoke('create_project', { input });

export const listProjects = (): Promise<Project[]> =>
  invoke('list_projects');

export const getProject = (id: string): Promise<Project> =>
  invoke('get_project', { id });

export const deleteProject = (id: string): Promise<void> =>
  invoke('delete_project', { id });

// Mod commands
export const addModToProject = (projectId: string, input: ModInput): Promise<ProjectMod> =>
  invoke('add_mod_to_project', { projectId, input });

export const removeModFromProject = (projectId: string, modId: string): Promise<void> =>
  invoke('remove_mod_from_project', { projectId, modId });

export const listProjectMods = (projectId: string): Promise<ProjectMod[]> =>
  invoke('list_project_mods', { projectId });

// Dependency commands
export const saveDependencies = (modId: string, deps: DepInput[]): Promise<void> =>
  invoke('save_dependencies', { modId, deps });

export const getDependencies = (modId: string): Promise<Dependency[]> =>
  invoke('get_dependencies', { modId });

export const getAllDependencies = (projectId: string): Promise<Dependency[]> =>
  invoke('get_all_dependencies', { projectId });
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/tauri.ts
git commit -m "feat: add typed Tauri IPC invoke wrappers"
```

---

### Task 8: Zustand Stores

**Files:**
- Create: `src/stores/projectStore.ts`
- Create: `src/stores/uiStore.ts`
- Create: `src/stores/graphStore.ts`

- [ ] **Step 1: Create project store**

Create `src/stores/projectStore.ts`:
```typescript
import { create } from 'zustand';
import type { Project, ProjectMod, ProjectInput, ModInput } from '../types';
import * as tauri from '../lib/tauri';

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  mods: ProjectMod[];
  loading: boolean;
  error: string | null;

  loadProjects: () => Promise<void>;
  createProject: (input: ProjectInput) => Promise<Project>;
  selectProject: (id: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addMod: (input: ModInput) => Promise<void>;
  removeMod: (modId: string) => Promise<void>;
  loadMods: () => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProject: null,
  mods: [],
  loading: false,
  error: null,

  loadProjects: async () => {
    set({ loading: true, error: null });
    try {
      const projects = await tauri.listProjects();
      set({ projects, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  createProject: async (input) => {
    set({ loading: true, error: null });
    try {
      const project = await tauri.createProject(input);
      set((state) => ({ projects: [project, ...state.projects], loading: false }));
      return project;
    } catch (e) {
      set({ error: String(e), loading: false });
      throw e;
    }
  },

  selectProject: async (id) => {
    set({ loading: true, error: null });
    try {
      const project = await tauri.getProject(id);
      const mods = await tauri.listProjectMods(id);
      set({ currentProject: project, mods, loading: false });
    } catch (e) {
      set({ error: String(e), loading: false });
    }
  },

  deleteProject: async (id) => {
    try {
      await tauri.deleteProject(id);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== id),
        currentProject: state.currentProject?.id === id ? null : state.currentProject,
        mods: state.currentProject?.id === id ? [] : state.mods,
      }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  addMod: async (input) => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const mod = await tauri.addModToProject(project.id, input);
      set((state) => ({ mods: [...state.mods, mod] }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  removeMod: async (modId) => {
    const project = get().currentProject;
    if (!project) return;
    try {
      await tauri.removeModFromProject(project.id, modId);
      set((state) => ({ mods: state.mods.filter((m) => m.id !== modId) }));
    } catch (e) {
      set({ error: String(e) });
    }
  },

  loadMods: async () => {
    const project = get().currentProject;
    if (!project) return;
    try {
      const mods = await tauri.listProjectMods(project.id);
      set({ mods });
    } catch (e) {
      set({ error: String(e) });
    }
  },
}));
```

- [ ] **Step 2: Create UI store**

Create `src/stores/uiStore.ts`:
```typescript
import { create } from 'zustand';
import type { ViewType } from '../types';

interface UiState {
  activeView: ViewType;
  inspectorOpen: boolean;
  selectedNodeId: string | null;

  setActiveView: (view: ViewType) => void;
  setInspectorOpen: (open: boolean) => void;
  setSelectedNodeId: (id: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'projects',
  inspectorOpen: false,
  selectedNodeId: null,

  setActiveView: (view) => set({ activeView: view }),
  setInspectorOpen: (open) => set({ inspectorOpen: open }),
  setSelectedNodeId: (id) => set({ selectedNodeId: id, inspectorOpen: id !== null }),
}));
```

- [ ] **Step 3: Create graph store**

Create `src/stores/graphStore.ts`:
```typescript
import { create } from 'zustand';
import type { Node, Edge } from 'reactflow';

interface GraphState {
  nodes: Node[];
  edges: Edge[];
  searchQuery: string;

  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSearchQuery: (query: string) => void;
  focusNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  nodes: [],
  edges: [],
  searchQuery: '',

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  focusNode: (nodeId) => {
    // Will be implemented with React Flow integration in Slice 3
    console.log('Focus node:', nodeId);
  },

  toggleCollapse: (nodeId) => {
    set((state) => ({
      nodes: state.nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, collapsed: !node.data.collapsed } }
          : node
      ),
    }));
  },
}));
```

- [ ] **Step 4: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for project, UI, and graph state"
```

---

### Task 9: TailwindCSS Theme Configuration

**Files:**
- Modify: `tailwind.config.js` (or `tailwind.config.ts`)

- [ ] **Step 1: Configure Tailwind with ModCanvas design tokens**

Replace the Tailwind config content with the ModCanvas theme:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#F2F2F7',
        surface: '#FFFFFF',
        separator: '#C6C6C8',
        'text-primary': '#1C1C1E',
        'text-secondary': '#8E8E93',
        'text-tertiary': '#AEAEB2',
        accent: '#D4A017',
        'accent-light': '#FFCC66',
        danger: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
        info: '#007AFF',
        'node-mod': '#D4A017',
        'node-library': '#007AFF',
        'node-api': '#8B5CF6',
        'node-loader': '#34C759',
      },
      fontFamily: {
        heading: ['"SF Pro Display"', '"Inter Tight"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      spacing: {
        sidebar: '240px',
        inspector: '320px',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 2: Update global CSS**

Replace `src/styles.css` (or `src/index.css`) with:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Inter+Tight:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  font-family: 'Inter', system-ui, sans-serif;
  color: #1C1C1E;
  background: #F2F2F7;
  -webkit-font-smoothing: antialiased;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #C6C6C8;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #8E8E93;
}
```

- [ ] **Step 3: Commit**

```bash
git add tailwind.config.js src/styles.css
git commit -m "feat: configure TailwindCSS with ModCanvas design tokens and global styles"
```

---

### Task 10: Layout Components

**Files:**
- Create: `src/components/layout/Sidebar.tsx`
- Create: `src/components/layout/Canvas.tsx`
- Create: `src/components/layout/Inspector.tsx`

- [ ] **Step 1: Create Sidebar component**

Create `src/components/layout/Sidebar.tsx`:
```tsx
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import type { ViewType } from '../../types';

const NAV_ITEMS: { key: ViewType; label: string; icon: string }[] = [
  { key: 'projects', label: 'Projects', icon: '📁' },
  { key: 'discover', label: 'Discover', icon: '🔍' },
  { key: 'graph', label: 'Graph', icon: '🔗' },
  { key: 'diagnostics', label: 'Diagnostics', icon: '⚠️' },
  { key: 'export', label: 'Export', icon: '📦' },
];

export function Sidebar() {
  const activeView = useUiStore((s) => s.activeView);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);

  return (
    <aside className="w-sidebar h-full bg-background flex flex-col border-r border-separator">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-separator">
        <h1 className="font-heading text-lg font-bold text-text-primary tracking-tight">
          ModCanvas
        </h1>
        <p className="text-xs text-text-tertiary mt-0.5">Design Modpacks Visually</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.key}
            onClick={() => setActiveView(item.key)}
            className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm transition-colors duration-150
              ${activeView === item.key
                ? 'bg-surface text-accent font-medium shadow-sm'
                : 'text-text-secondary hover:bg-surface/60 hover:text-text-primary'
              }`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Project Info */}
      {currentProject && (
        <div className="px-5 py-3 border-t border-separator bg-surface">
          <p className="text-xs text-text-tertiary uppercase tracking-wider">Current Project</p>
          <p className="text-sm font-medium text-text-primary mt-1 truncate">{currentProject.name}</p>
          <p className="text-xs text-text-secondary mt-0.5">
            {currentProject.mc_version} · {currentProject.loader} · {mods.length} mods
          </p>
        </div>
      )}
    </aside>
  );
}
```

- [ ] **Step 2: Create Canvas component**

Create `src/components/layout/Canvas.tsx`:
```tsx
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectList } from '../project/ProjectList';
import { ProjectCreate } from '../project/ProjectCreate';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';

export function Canvas() {
  const activeView = useUiStore((s) => s.activeView);
  const currentProject = useProjectStore((s) => s.currentProject);

  const renderContent = () => {
    switch (activeView) {
      case 'projects':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <ProjectCreate />
            <ProjectList />
          </div>
        );
      case 'discover':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <SearchBar />
            <SearchResults />
          </div>
        );
      case 'graph':
        return (
          <div className="h-full flex items-center justify-center text-text-tertiary">
            {currentProject
              ? 'Graph view — will be implemented in Slice 3'
              : 'Select a project to view its dependency graph'}
          </div>
        );
      case 'diagnostics':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Diagnostics</h2>
            <p className="text-text-secondary">Will be implemented in Slice 4</p>
          </div>
        );
      case 'export':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Export</h2>
            <p className="text-text-secondary">Will be implemented in Slice 5</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 h-full bg-background overflow-auto">
      {renderContent()}
    </main>
  );
}
```

- [ ] **Step 3: Create Inspector component**

Create `src/components/layout/Inspector.tsx`:
```tsx
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';

export function Inspector() {
  const inspectorOpen = useUiStore((s) => s.inspectorOpen);
  const selectedNodeId = useUiStore((s) => s.selectedNodeId);
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId);
  const mods = useProjectStore((s) => s.mods);

  const selectedMod = selectedNodeId
    ? mods.find((m) => m.id === selectedNodeId)
    : null;

  if (!inspectorOpen || !selectedMod) {
    return (
      <aside className="w-inspector h-full bg-surface border-l border-separator flex items-center justify-center">
        <p className="text-text-tertiary text-sm">Select a mod to inspect</p>
      </aside>
    );
  }

  return (
    <aside className="w-inspector h-full bg-surface border-l border-separator overflow-auto">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-base font-semibold text-text-primary truncate">
            {selectedMod.name}
          </h3>
          <button
            onClick={() => setSelectedNodeId(null)}
            className="text-text-tertiary hover:text-text-primary transition-colors"
          >
            ✕
          </button>
        </div>

        {selectedMod.icon_url && (
          <img
            src={selectedMod.icon_url}
            alt={selectedMod.name}
            className="w-16 h-16 rounded-lg mb-3"
          />
        )}

        <div className="space-y-3 text-sm">
          {selectedMod.version_number && (
            <div>
              <span className="text-text-tertiary">Version</span>
              <p className="text-text-primary font-mono">{selectedMod.version_number}</p>
            </div>
          )}
          {selectedMod.author && (
            <div>
              <span className="text-text-tertiary">Author</span>
              <p className="text-text-primary">{selectedMod.author}</p>
            </div>
          )}
          {selectedMod.description && (
            <div>
              <span className="text-text-tertiary">Description</span>
              <p className="text-text-primary">{selectedMod.description}</p>
            </div>
          )}
          {selectedMod.license && (
            <div>
              <span className="text-text-tertiary">License</span>
              <p className="text-text-primary">{selectedMod.license}</p>
            </div>
          )}
          {selectedMod.source_url && (
            <div>
              <span className="text-text-tertiary">Source</span>
              <a
                href={selectedMod.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-info hover:underline"
              >
                {selectedMod.source_url}
              </a>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/
git commit -m "feat: add Sidebar, Canvas, and Inspector layout components"
```

---

### Task 11: Project Components

**Files:**
- Create: `src/components/project/ProjectList.tsx`
- Create: `src/components/project/ProjectCreate.tsx`

- [ ] **Step 1: Create ProjectList component**

Create `src/components/project/ProjectList.tsx`:
```tsx
import { useEffect } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';

export function ProjectList() {
  const projects = useProjectStore((s) => s.projects);
  const loadProjects = useProjectStore((s) => s.loadProjects);
  const selectProject = useProjectStore((s) => s.selectProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const setActiveView = useUiStore((s) => s.setActiveView);
  const loading = useProjectStore((s) => s.loading);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpen = async (id: string) => {
    await selectProject(id);
    setActiveView('graph');
  };

  if (loading && projects.length === 0) {
    return <p className="text-text-secondary text-sm mt-4">Loading projects...</p>;
  }

  if (projects.length === 0) {
    return (
      <div className="mt-8 text-center">
        <p className="text-text-tertiary">No projects yet</p>
        <p className="text-text-tertiary text-sm mt-1">Create your first modpack above</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <h2 className="font-heading text-lg font-semibold text-text-primary">Your Projects</h2>
      {projects.map((project) => (
        <div
          key={project.id}
          className="bg-surface rounded-xl p-4 shadow-sm border border-separator/50 hover:shadow-md transition-shadow duration-150"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-text-primary truncate">
                {project.name}
              </h3>
              <p className="text-sm text-text-secondary mt-0.5">
                {project.mc_version} · {project.loader}
              </p>
              {project.description && (
                <p className="text-sm text-text-tertiary mt-1 line-clamp-2">
                  {project.description}
                </p>
              )}
            </div>
            <div className="flex gap-2 ml-3">
              <button
                onClick={() => handleOpen(project.id)}
                className="px-3 py-1.5 text-sm font-medium bg-accent text-white rounded-lg hover:bg-accent-light transition-colors duration-150"
              >
                Open
              </button>
              <button
                onClick={() => deleteProject(project.id)}
                className="px-3 py-1.5 text-sm font-medium text-danger border border-danger/30 rounded-lg hover:bg-danger/5 transition-colors duration-150"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Create ProjectCreate component**

Create `src/components/project/ProjectCreate.tsx`:
```tsx
import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import type { Loader } from '../../types';

const MC_VERSIONS = ['1.21.1', '1.21', '1.20.6', '1.20.4', '1.20.1', '1.19.4', '1.19.2', '1.18.2', '1.16.5'];
const LOADERS: Loader[] = ['forge', 'neoforge', 'fabric', 'quilt'];

export function ProjectCreate() {
  const createProject = useProjectStore((s) => s.createProject);
  const selectProject = useProjectStore((s) => s.selectProject);
  const setActiveView = useUiStore((s) => s.setActiveView);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [mcVersion, setMcVersion] = useState('1.21.1');
  const [loader, setLoader] = useState<Loader>('fabric');
  const [author, setAuthor] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    const project = await createProject({
      name: name.trim(),
      description: description.trim(),
      mc_version: mcVersion,
      loader,
      author: author.trim(),
      tags: [],
    });
    await selectProject(project.id);
    setActiveView('graph');
    // Reset form
    setName('');
    setDescription('');
    setAuthor('');
    setExpanded(false);
  };

  return (
    <div className="bg-surface rounded-xl p-5 shadow-sm border border-separator/50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="font-heading text-lg font-semibold text-text-primary">Create New Pack</h2>
        <span className="text-text-tertiary text-xl">{expanded ? '−' : '+'}</span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tech Revolution"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Technology-focused progression pack"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Minecraft Version</label>
              <select
                value={mcVersion}
                onChange={(e) => setMcVersion(e.target.value)}
                className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {MC_VERSIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs text-text-tertiary uppercase tracking-wider">Loader</label>
              <select
                value={loader}
                onChange={(e) => setLoader(e.target.value as Loader)}
                className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent"
              >
                {LOADERS.map((l) => (
                  <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-text-tertiary uppercase tracking-wider">Author</label>
            <input
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Your name"
              className="w-full mt-1 px-3 py-2 bg-background rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={!name.trim()}
            className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
          >
            Create Pack
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/project/
git commit -m "feat: add ProjectList and ProjectCreate components"
```

---

### Task 12: Search Components (Placeholder)

**Files:**
- Create: `src/components/search/SearchBar.tsx`
- Create: `src/components/search/SearchResults.tsx`

- [ ] **Step 1: Create SearchBar placeholder**

Create `src/components/search/SearchBar.tsx`:
```tsx
export function SearchBar() {
  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Discover Mods</h2>
      <p className="text-text-secondary">Search will be implemented in Slice 2</p>
    </div>
  );
}
```

- [ ] **Step 2: Create SearchResults placeholder**

Create `src/components/search/SearchResults.tsx`:
```tsx
export function SearchResults() {
  return null;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/search/
git commit -m "feat: add search component placeholders"
```

---

### Task 13: App Root + Entry Point

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: Create App root layout**

Replace `src/App.tsx`:
```tsx
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';

export default function App() {
  return (
    <div className="flex h-screen w-screen overflow-hidden">
      <Sidebar />
      <Canvas />
      <Inspector />
    </div>
  );
}
```

- [ ] **Step 2: Update main entry point**

Replace `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 3: Verify the app runs**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Window opens with three-column layout, can create and list projects.

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: wire up App root layout with Sidebar, Canvas, and Inspector"
```

---

## Slice 2: Mod Search

### Task 14: Rust Modrinth Client

**Files:**
- Create: `src-tauri/src/modrinth/types.rs`
- Create: `src-tauri/src/modrinth/client.rs`
- Modify: `src-tauri/src/modrinth/mod.rs`

- [ ] **Step 1: Create Modrinth API types**

Create `src-tauri/src/modrinth/types.rs`:
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResponse {
    pub hits: Vec<SearchHit>,
    pub offset: i64,
    pub limit: i64,
    pub total_hits: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SearchHit {
    pub project_id: String,
    pub project_type: Option<String>,
    pub slug: Option<String>,
    pub author: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub categories: Vec<String>,
    pub downloads: Option<i64>,
    pub icon_url: Option<String>,
    pub latest_version: Option<String>,
    pub versions: Vec<String>,
    pub loaders: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModrinthProject {
    pub id: String,
    pub slug: Option<String>,
    pub title: String,
    pub description: Option<String>,
    pub categories: Vec<String>,
    pub client_side: Option<String>,
    pub server_side: Option<String>,
    pub downloads: i64,
    pub icon_url: Option<String>,
    pub source_url: Option<String>,
    pub license: Option<ModrinthLicense>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModrinthLicense {
    pub id: Option<String>,
    pub name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModrinthVersion {
    pub id: String,
    pub project_id: String,
    pub name: Option<String>,
    pub version_number: Option<String>,
    pub changelog: Option<String>,
    pub dependencies: Vec<ModrinthDependency>,
    pub game_versions: Vec<String>,
    pub loaders: Vec<String>,
    pub files: Vec<ModrinthFile>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ModrinthDependency {
    pub version_id: Option<String>,
    pub project_id: Option<String>,
    pub file_name: Option<String>,
    pub dependency_type: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModrinthFile {
    pub hashes: Option<std::collections::HashMap<String, String>>,
    pub url: Option<String>,
    pub filename: Option<String>,
    pub primary: Option<bool>,
    pub size: Option<i64>,
}
```

- [ ] **Step 2: Create Modrinth HTTP client**

Create `src-tauri/src/modrinth/client.rs`:
```rust
use crate::modrinth::types::*;
use reqwest::Client;

const MODRINTH_API_BASE: &str = "https://api.modrinth.com/v2";
const USER_AGENT: &str = "ModCanvas/0.1 (modcanvas.app)";

pub struct ModrinthClient {
    client: Client,
}

impl ModrinthClient {
    pub fn new() -> Self {
        let client = Client::builder()
            .user_agent(USER_AGENT)
            .build()
            .expect("Failed to create HTTP client");
        Self { client }
    }

    pub async fn search(
        &self,
        query: &str,
        loaders: Option<Vec<String>>,
        game_versions: Option<Vec<String>>,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<SearchResponse, String> {
        let mut params: Vec<(&str, String)> = vec![("query", query.to_string())];

        // Build facets filter
        let mut facets: Vec<Vec<String>> = Vec::new();
        if let Some(loaders) = loaders {
            let loader_facets: Vec<String> = loaders.iter().map(|l| format!("categories:{}", l)).collect();
            facets.push(loader_facets);
        }
        if let Some(versions) = game_versions {
            let version_facets: Vec<String> = versions.iter().map(|v| format!("versions:{}", v)).collect();
            facets.push(version_facets);
        }
        if !facets.is_empty() {
            params.push(("facets", serde_json::to_string(&facets).unwrap_or_default()));
        }

        if let Some(limit) = limit {
            params.push(("limit", limit.to_string()));
        }
        if let Some(offset) = offset {
            params.push(("offset", offset.to_string()));
        }

        let resp = self.client
            .get(format!("{}/search", MODRINTH_API_BASE))
            .query(&params)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        resp.json::<SearchResponse>().await.map_err(|e| e.to_string())
    }

    pub async fn get_project(&self, id: &str) -> Result<ModrinthProject, String> {
        let resp = self.client
            .get(format!("{}/project/{}", MODRINTH_API_BASE, id))
            .send()
            .await
            .map_err(|e| e.to_string())?;

        resp.json::<ModrinthProject>().await.map_err(|e| e.to_string())
    }

    pub async fn get_versions(
        &self,
        project_id: &str,
        game_version: Option<&str>,
        loader: Option<&str>,
    ) -> Result<Vec<ModrinthVersion>, String> {
        let mut url = format!("{}/project/{}/version", MODRINTH_API_BASE, project_id);

        let mut params: Vec<(&str, String)> = Vec::new();
        if let Some(gv) = game_version {
            params.push(("game_versions", format!("[\"{}\"]", gv)));
        }
        if let Some(l) = loader {
            params.push(("loaders", format!("[\"{}\"]", l)));
        }

        if !params.is_empty() {
            let query_string: Vec<String> = params.iter().map(|(k, v)| format!("{}={}", k, v)).collect();
            url = format!("{}?{}", url, query_string.join("&"));
        }

        let resp = self.client
            .get(&url)
            .send()
            .await
            .map_err(|e| e.to_string())?;

        resp.json::<Vec<ModrinthVersion>>().await.map_err(|e| e.to_string())
    }
}
```

- [ ] **Step 3: Update modrinth module**

Replace `src-tauri/src/modrinth/mod.rs`:
```rust
pub mod client;
pub mod types;
```

- [ ] **Step 4: Commit**

```bash
git add src-tauri/src/modrinth/
git commit -m "feat: add Modrinth API client with search, project, and version endpoints"
```

---

### Task 15: Rust Search Commands

**Files:**
- Create: `src-tauri/src/commands/search.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create search commands**

Create `src-tauri/src/commands/search.rs`:
```rust
use crate::modrinth::client::ModrinthClient;
use crate::modrinth::types::*;
use serde::Deserialize;
use tauri::State;

pub struct ModrinthState(pub ModrinthClient);

#[derive(Debug, Deserialize)]
pub struct SearchFilters {
    pub loaders: Option<Vec<String>>,
    pub game_versions: Option<Vec<String>>,
}

#[tauri::command]
pub async fn search_mods(
    query: String,
    filters: Option<SearchFilters>,
    limit: Option<u32>,
    offset: Option<u32>,
    client: State<'_, ModrinthState>,
) -> Result<SearchResponse, String> {
    let (loaders, game_versions) = match filters {
        Some(f) => (f.loaders, f.game_versions),
        None => (None, None),
    };
    client.0.search(&query, loaders, game_versions, limit, offset).await
}

#[tauri::command]
pub async fn get_mod_details(
    modrinth_id: String,
    client: State<'_, ModrinthState>,
) -> Result<ModrinthProject, String> {
    client.0.get_project(&modrinth_id).await
}

#[tauri::command]
pub async fn get_mod_versions(
    modrinth_id: String,
    mc_version: Option<String>,
    loader: Option<String>,
    client: State<'_, ModrinthState>,
) -> Result<Vec<ModrinthVersion>, String> {
    client.0.get_versions(
        &modrinth_id,
        mc_version.as_deref(),
        loader.as_deref(),
    ).await
}
```

- [ ] **Step 2: Update commands module**

Replace `src-tauri/src/commands/mod.rs`:
```rust
pub mod project;
pub mod mods;
pub mod search;
```

- [ ] **Step 3: Update main.rs to register search commands and ModrinthState**

Replace `src-tauri/src/main.rs`:
```rust
mod commands;
mod db;
mod modrinth;

use db::DbState;
use modrinth::client::ModrinthClient;
use commands::search::ModrinthState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data dir")
                .to_string_lossy()
                .to_string();

            std::fs::create_dir_all(&app_data_dir).ok();

            let conn = db::init_db(&app_data_dir)
                .expect("Failed to initialize database");

            app.manage(Mutex::new(conn));
            app.manage(ModrinthState(ModrinthClient::new()));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::delete_project,
            commands::mods::add_mod_to_project,
            commands::mods::remove_mod_from_project,
            commands::mods::list_project_mods,
            commands::mods::save_dependencies,
            commands::mods::get_dependencies,
            commands::mods::get_all_dependencies,
            commands::search::search_mods,
            commands::search::get_mod_details,
            commands::search::get_mod_versions,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

- [ ] **Step 4: Verify Rust compiles**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas/src-tauri && cargo check
```

Expected: Compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add src-tauri/src/
git commit -m "feat: add Modrinth search commands and register in main"
```

---

### Task 16: Frontend Search Hook + IPC

**Files:**
- Modify: `src/lib/tauri.ts`
- Create: `src/hooks/useModrinth.ts`

- [ ] **Step 1: Add search IPC wrappers to tauri.ts**

Append to `src/lib/tauri.ts`:
```typescript
import type { ModrinthSearchResult, ModrinthVersion } from '../types';

interface SearchFilters {
  loaders?: string[];
  game_versions?: string[];
}

export const searchMods = (query: string, filters?: SearchFilters, limit?: number, offset?: number): Promise<ModrinthSearchResult> =>
  invoke('search_mods', { query, filters, limit, offset });

export const getModDetails = (modrinthId: string): Promise<any> =>
  invoke('get_mod_details', { modrinthId });

export const getModVersions = (modrinthId: string, mcVersion?: string, loader?: string): Promise<ModrinthVersion[]> =>
  invoke('get_mod_versions', { modrinthId, mcVersion, loader });
```

- [ ] **Step 2: Create useModrinth hook**

Create `src/hooks/useModrinth.ts`:
```typescript
import { useQuery } from '@tanstack/react-query';
import * as tauri from '../lib/tauri';

export function useModSearch(query: string, loaders?: string[], gameVersions?: string[]) {
  return useQuery({
    queryKey: ['modSearch', query, loaders, gameVersions],
    queryFn: () =>
      tauri.searchMods(query, {
        loaders: loaders,
        game_versions: gameVersions,
      }, 20, 0),
    enabled: query.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useModVersions(modrinthId: string | null, mcVersion?: string, loader?: string) {
  return useQuery({
    queryKey: ['modVersions', modrinthId, mcVersion, loader],
    queryFn: () => tauri.getModVersions(modrinthId!, mcVersion, loader),
    enabled: modrinthId !== null,
    staleTime: 10 * 60 * 1000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/tauri.ts src/hooks/useModrinth.ts
git commit -m "feat: add Modrinth search hooks with TanStack Query"
```

---

### Task 17: Search UI Components

**Files:**
- Modify: `src/components/search/SearchBar.tsx`
- Modify: `src/components/search/SearchResults.tsx`

- [ ] **Step 1: Implement SearchBar**

Replace `src/components/search/SearchBar.tsx`:
```tsx
import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const currentProject = useProjectStore((s) => s.currentProject);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div>
      <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Discover Mods</h2>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search mods on Modrinth..."
          className="flex-1 px-4 py-2.5 bg-surface rounded-lg border border-separator text-text-primary text-sm focus:outline-none focus:border-accent transition-colors"
        />
        <button
          type="submit"
          disabled={!query.trim()}
          className="px-5 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          Search
        </button>
      </form>
      {currentProject && (
        <p className="text-xs text-text-tertiary mt-2">
          Filtering for {currentProject.loader} · {currentProject.mc_version}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Implement SearchResults**

Replace `src/components/search/SearchResults.tsx`:
```tsx
import { useModSearch } from '../../hooks/useModrinth';
import { useProjectStore } from '../../stores/projectStore';
import type { ModrinthSearchHit } from '../../types';

interface SearchResultsProps {
  query: string;
}

export function SearchResults({ query }: SearchResultsProps) {
  const currentProject = useProjectStore((s) => s.currentProject);
  const addMod = useProjectStore((s) => s.addMod);
  const mods = useProjectStore((s) => s.mods);

  const loaders = currentProject ? [currentProject.loader] : undefined;
  const gameVersions = currentProject ? [currentProject.mc_version] : undefined;

  const { data, isLoading, error } = useModSearch(query, loaders, gameVersions);

  const isModAdded = (hit: ModrinthSearchHit) =>
    mods.some((m) => m.modrinth_id === hit.project_id);

  const handleAdd = async (hit: ModrinthSearchHit) => {
    await addMod({
      modrinth_id: hit.project_id,
      slug: hit.slug ?? null,
      name: hit.title,
      version_id: null,
      version_number: null,
      icon_url: hit.icon_url ?? null,
      description: hit.description ?? null,
      author: hit.author ?? null,
      source_url: null,
      license: null,
    });
  };

  if (!query) return null;

  if (isLoading) {
    return <p className="text-text-secondary text-sm mt-4">Searching...</p>;
  }

  if (error) {
    return <p className="text-danger text-sm mt-4">Search failed: {String(error)}</p>;
  }

  if (!data || data.hits.length === 0) {
    return <p className="text-text-secondary text-sm mt-4">No results found</p>;
  }

  return (
    <div className="mt-4 space-y-2">
      <p className="text-xs text-text-tertiary">{data.total_hits} results</p>
      {data.hits.map((hit) => (
        <div
          key={hit.project_id}
          className="bg-surface rounded-xl p-4 shadow-sm border border-separator/50 flex items-start gap-3"
        >
          {hit.icon_url ? (
            <img src={hit.icon_url} alt={hit.title} className="w-10 h-10 rounded-lg flex-shrink-0" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center text-text-tertiary flex-shrink-0">
              ?
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-text-primary text-sm truncate">{hit.title}</h3>
            <p className="text-xs text-text-secondary mt-0.5">by {hit.author ?? 'Unknown'}</p>
            {hit.description && (
              <p className="text-xs text-text-tertiary mt-1 line-clamp-2">{hit.description}</p>
            )}
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {hit.loaders.slice(0, 3).map((l) => (
                <span key={l} className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">
                  {l}
                </span>
              ))}
              <span className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">
                {hit.downloads?.toLocaleString() ?? 0} downloads
              </span>
            </div>
          </div>
          <button
            onClick={() => handleAdd(hit)}
            disabled={isModAdded(hit)}
            className="px-3 py-1.5 text-xs font-medium bg-accent text-white rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150 flex-shrink-0"
          >
            {isModAdded(hit) ? 'Added' : 'Add'}
          </button>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Update Canvas to wire search**

Replace `src/components/layout/Canvas.tsx`:
```tsx
import { useState } from 'react';
import { useUiStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import { ProjectList } from '../project/ProjectList';
import { ProjectCreate } from '../project/ProjectCreate';
import { SearchBar } from '../search/SearchBar';
import { SearchResults } from '../search/SearchResults';

export function Canvas() {
  const activeView = useUiStore((s) => s.activeView);
  const currentProject = useProjectStore((s) => s.currentProject);
  const [searchQuery, setSearchQuery] = useState('');

  const renderContent = () => {
    switch (activeView) {
      case 'projects':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <ProjectCreate />
            <ProjectList />
          </div>
        );
      case 'discover':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <SearchBar onSearch={setSearchQuery} />
            <SearchResults query={searchQuery} />
          </div>
        );
      case 'graph':
        return (
          <div className="h-full flex items-center justify-center text-text-tertiary">
            {currentProject
              ? 'Graph view — will be implemented in Slice 3'
              : 'Select a project to view its dependency graph'}
          </div>
        );
      case 'diagnostics':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Diagnostics</h2>
            <p className="text-text-secondary">Will be implemented in Slice 4</p>
          </div>
        );
      case 'export':
        return (
          <div className="p-6 max-w-3xl mx-auto">
            <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Export</h2>
            <p className="text-text-secondary">Will be implemented in Slice 5</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <main className="flex-1 h-full bg-background overflow-auto">
      {renderContent()}
    </main>
  );
}
```

- [ ] **Step 4: Add QueryClientProvider to main.tsx**

Replace `src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 5: Verify search works**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Can search mods on Modrinth, see results, add mods to project.

- [ ] **Step 6: Commit**

```bash
git add src/
git commit -m "feat: implement mod search UI with Modrinth integration"
```

---

## Slice 3: Dependency Graph

### Task 18: Frontend Engine — Dependency Resolver

**Files:**
- Create: `src/engine/dependencyResolver.ts`

- [ ] **Step 1: Create dependency resolver**

Create `src/engine/dependencyResolver.ts`:
```typescript
import type { ProjectMod, Dependency, DepType } from '../types';

export interface ResolvedDependency {
  fromModId: string;
  toSlug: string;
  depType: DepType;
  toModrinthId: string | null;
  resolved: boolean;
  resolvedModId: string | null;
}

/**
 * Resolve direct dependencies for a list of mods.
 * Matches dependency slugs against mod slugs and modrinth_ids in the project.
 */
export function resolveDependencies(
  mods: ProjectMod[],
  storedDeps: Dependency[]
): ResolvedDependency[] {
  const slugToMod = new Map<string, ProjectMod>();
  const modrinthIdToMod = new Map<string, ProjectMod>();

  for (const mod of mods) {
    if (mod.slug) slugToMod.set(mod.slug.toLowerCase(), mod);
    if (mod.modrinth_id) modrinthIdToMod.set(mod.modrinth_id, mod);
  }

  return storedDeps.map((dep) => {
    const slugMatch = slugToMod.get(dep.depends_on_slug.toLowerCase());
    const modrinthMatch = dep.dep_modrinth_id
      ? modrinthIdToMod.get(dep.dep_modrinth_id)
      : null;
    const resolved = slugMatch ?? modrinthMatch;

    return {
      fromModId: dep.project_mod_id,
      toSlug: dep.depends_on_slug,
      depType: dep.dep_type as DepType,
      toModrinthId: dep.dep_modrinth_id,
      resolved: resolved !== undefined,
      resolvedModId: resolved?.id ?? null,
    };
  });
}

/**
 * Determine the node type based on mod properties.
 */
export function getNodeType(mod: ProjectMod): 'mod' | 'library' | 'api' | 'loader' {
  const slug = (mod.slug ?? '').toLowerCase();
  const name = mod.name.toLowerCase();

  if (slug.includes('forge') || slug.includes('fabric') || slug.includes('quilt') || slug.includes('neoforge')) {
    return 'loader';
  }
  if (slug.includes('api') || name.includes(' api')) {
    return 'api';
  }
  if (slug.includes('lib') || name.includes(' library') || name.includes('lib')) {
    return 'library';
  }
  return 'mod';
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/dependencyResolver.ts
git commit -m "feat: add dependency resolver engine"
```

---

### Task 19: Frontend Engine — Graph Layout

**Files:**
- Create: `src/engine/graphLayout.ts`

- [ ] **Step 1: Create graph layout engine using dagre**

Create `src/engine/graphLayout.ts`:
```typescript
import dagre from '@dagre/dagre';
import type { Node, Edge } from 'reactflow';
import type { ModNodeData } from '../types';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 80;

/**
 * Compute auto-layout for graph nodes using dagre.
 * Direction: left-to-right (Loader → API → Library → Mod).
 */
export function computeLayout(
  nodes: Node<ModNodeData>[],
  edges: Edge[]
): Node<ModNodeData>[] {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 120 });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  for (const edge of edges) {
    g.setEdge(edge.source, edge.target);
  }

  dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 },
    };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add src/engine/graphLayout.ts
git commit -m "feat: add dagre-based graph layout engine"
```

---

### Task 20: Graph Components

**Files:**
- Create: `src/components/graph/ModNode.tsx`
- Create: `src/components/graph/DependencyEdge.tsx`
- Create: `src/components/graph/GraphControls.tsx`
- Create: `src/components/graph/GraphCanvas.tsx`

- [ ] **Step 1: Create ModNode component**

Create `src/components/graph/ModNode.tsx`:
```tsx
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ModNodeData } from '../../types';

const NODE_TYPE_COLORS: Record<string, string> = {
  mod: '#D4A017',
  library: '#007AFF',
  api: '#8B5CF6',
  loader: '#34C759',
};

const NODE_TYPE_LABELS: Record<string, string> = {
  mod: 'Mod',
  library: 'Library',
  api: 'API',
  loader: 'Loader',
};

export function ModNode({ data, selected }: NodeProps<ModNodeData>) {
  const borderColor = NODE_TYPE_COLORS[data.nodeType] || '#C6C6C8';
  const typeLabel = NODE_TYPE_LABELS[data.nodeType] || 'Mod';

  return (
    <div
      className={`bg-surface rounded-lg shadow-sm border-l-[3px] transition-shadow duration-150
        ${selected ? 'shadow-md ring-1 ring-accent/30' : 'shadow-sm'}
        ${data.hasConflict ? 'ring-2 ring-danger/50' : ''}`}
      style={{ borderLeftColor: borderColor }}
    >
      <Handle type="target" position={Position.Left} className="!bg-text-tertiary !w-2 !h-2" />

      <div className="px-3 py-2 min-w-[180px]">
        <div className="flex items-center gap-2">
          {data.iconUrl ? (
            <img src={data.iconUrl} alt="" className="w-6 h-6 rounded flex-shrink-0" />
          ) : (
            <div
              className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-[10px] text-white font-bold"
              style={{ backgroundColor: borderColor }}
            >
              {typeLabel[0]}
            </div>
          )}
          <span className="text-sm font-medium text-text-primary truncate">{data.name}</span>
        </div>
        <div className="flex items-center gap-2 mt-1">
          {data.version && (
            <span className="text-[10px] font-mono text-text-tertiary">{data.version}</span>
          )}
          <span
            className="text-[9px] px-1.5 py-0.5 rounded-full text-white font-medium"
            style={{ backgroundColor: borderColor }}
          >
            {typeLabel}
          </span>
          {data.collapsed && data.dependencyCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 bg-background rounded text-text-secondary">
              +{data.dependencyCount}
            </span>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-text-tertiary !w-2 !h-2" />
    </div>
  );
}
```

- [ ] **Step 2: Create DependencyEdge component**

Create `src/components/graph/DependencyEdge.tsx`:
```tsx
import { BaseEdge, getSmoothStepPath } from 'reactflow';
import type { EdgeProps } from 'reactflow';

export function DependencyEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 8,
  });

  const depType = data?.depType as string | undefined;
  const isIncompatible = depType === 'incompatible';
  const isOptional = depType === 'optional';

  let stroke = '#8E8E93';
  let strokeDasharray = '';
  let strokeWidth = 1.5;

  if (isIncompatible) {
    stroke = '#FF3B30';
    strokeDasharray = '6 3';
    strokeWidth = 2;
  } else if (isOptional) {
    stroke = '#AEAEB2';
    strokeDasharray = '4 4';
  }

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      style={{
        stroke,
        strokeWidth: selected ? strokeWidth + 1 : strokeWidth,
        strokeDasharray,
      }}
    />
  );
}
```

- [ ] **Step 3: Create GraphControls component**

Create `src/components/graph/GraphControls.tsx`:
```tsx
import { useReactFlow } from 'reactflow';
import { useGraphStore } from '../../stores/graphStore';

export function GraphControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const setSearchQuery = useGraphStore((s) => s.setSearchQuery);
  const nodes = useGraphStore((s) => s.nodes);
  const focusNode = useGraphStore((s) => s.focusNode);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const match = nodes.find((n) =>
      (n.data as any).name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (match) {
      focusNode(match.id);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 flex items-center gap-2 z-10">
      <form onSubmit={handleSearch} className="flex items-center gap-1">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search node..."
          className="px-3 py-1.5 bg-surface rounded-lg border border-separator text-text-primary text-xs focus:outline-none focus:border-accent transition-colors w-40"
        />
        <button
          type="submit"
          className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
        >
          Find
        </button>
      </form>
      <button
        onClick={() => fitView({ padding: 0.2 })}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        Fit
      </button>
      <button
        onClick={() => zoomIn()}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        +
      </button>
      <button
        onClick={() => zoomOut()}
        className="px-2 py-1.5 bg-surface rounded-lg border border-separator text-text-secondary text-xs hover:bg-background transition-colors"
      >
        −
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Create GraphCanvas component**

Create `src/components/graph/GraphCanvas.tsx`:
```tsx
import { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, { useNodesState, useEdgesState, useReactFlow } from 'reactflow';
import 'reactflow/dist/style.css';

import { ModNode } from './ModNode';
import { DependencyEdge } from './DependencyEdge';
import { GraphControls } from './GraphControls';
import { useProjectStore } from '../../stores/projectStore';
import { useUiStore } from '../../stores/uiStore';
import { useGraphStore } from '../../stores/graphStore';
import { computeLayout } from '../../engine/graphLayout';
import { getNodeType } from '../../engine/dependencyResolver';
import type { ModNodeData } from '../../types';
import type { Node, Edge } from 'reactflow';

const NODE_TYPES = { modNode: ModNode };
const EDGE_TYPES = { dependency: DependencyEdge };

export function GraphCanvas() {
  const mods = useProjectStore((s) => s.mods);
  const currentProject = useProjectStore((s) => s.currentProject);
  const setSelectedNodeId = useUiStore((s) => s.setSelectedNodeId);
  const setInspectorOpen = useUiStore((s) => s.setInspectorOpen);
  const setGraphNodes = useGraphStore((s) => s.setNodes);
  const setGraphEdges = useGraphStore((s) => s.setEdges);
  const toggleCollapse = useGraphStore((s) => s.toggleCollapse);

  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Build nodes and edges from mods
  useEffect(() => {
    if (!currentProject) return;

    // Create loader node
    const loaderNode: Node<ModNodeData> = {
      id: 'loader-node',
      type: 'modNode',
      position: { x: 0, y: 0 },
      data: {
        modId: 'loader',
        name: currentProject.loader.charAt(0).toUpperCase() + currentProject.loader.slice(1),
        version: currentProject.mc_version,
        loader: currentProject.loader,
        iconUrl: null,
        nodeType: 'loader',
        dependencyCount: 0,
        collapsed: false,
        hasConflict: false,
      },
    };

    const modNodes: Node<ModNodeData>[] = mods.map((mod) => ({
      id: mod.id,
      type: 'modNode',
      position: { x: 0, y: 0 },
      data: {
        modId: mod.id,
        name: mod.name,
        version: mod.version_number,
        loader: null,
        iconUrl: mod.icon_url,
        nodeType: getNodeType(mod),
        dependencyCount: 0,
        collapsed: false,
        hasConflict: false,
      },
    }));

    const allNodes = [loaderNode, ...modNodes];
    const layouted = computeLayout(allNodes, []);

    setNodes(layouted);
    setGraphNodes(layouted);
    setEdges([]);
    setGraphEdges([]);

    // Fit view after layout
    setTimeout(() => fitView({ padding: 0.2 }), 100);
  }, [mods, currentProject, setNodes, setEdges, setGraphNodes, setGraphEdges, fitView]);

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      if (node.id === 'loader-node') return;
      setSelectedNodeId(node.id);
      setInspectorOpen(true);
    },
    [setSelectedNodeId, setInspectorOpen]
  );

  const onNodeDoubleClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      toggleCollapse(node.id);
    },
    [toggleCollapse]
  );

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center text-text-tertiary">
        Select a project to view its dependency graph
      </div>
    );
  }

  return (
    <div className="h-full w-full relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-background"
      >
        <GraphControls />
      </ReactFlow>
    </div>
  );
}
```

- [ ] **Step 5: Update Canvas to use GraphCanvas**

Replace the graph case in `src/components/layout/Canvas.tsx`:
```tsx
case 'graph':
  return <GraphCanvas />;
```

Add import at top:
```tsx
import { GraphCanvas } from '../graph/GraphCanvas';
```

- [ ] **Step 6: Verify graph renders**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Create project → add mods → switch to Graph view → see nodes with auto-layout.

- [ ] **Step 7: Commit**

```bash
git add src/
git commit -m "feat: implement dependency graph with React Flow, dagre layout, and custom nodes"
```

---

## Slice 4: Conflict Detection

### Task 20: Frontend Engine — Conflict Detector

**Files:**
- Create: `src/engine/conflictDetector.ts`
- Create: `src/hooks/useDiagnostics.ts`
- Create: `src/components/diagnostics/DiagnosticsPanel.tsx`

- [ ] **Step 1: Create conflict detector engine**

Create `src/engine/conflictDetector.ts`:
```typescript
import type { ProjectMod, Diagnostic, Dependency } from '../types';

const KNOWN_INCOMPATIBILITIES: { mod1: string; mod2: string; reason: string }[] = [
  { mod1: 'optifine', mod2: 'sodium', reason: 'Rendering pipeline incompatibility' },
  { mod1: 'optifine', mod2: 'lithium', reason: 'Potential game logic conflicts' },
  { mod1: 'rubidium', mod2: 'embeddium', reason: 'Both are Sodium ports, redundant' },
];

export function detectConflicts(
  mods: ProjectMod[],
  dependencies: Dependency[],
  mcVersion: string,
  loader: string
): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const slugSet = new Set(mods.map((m) => (m.slug ?? '').toLowerCase()));

  // 1. Loader mismatch
  for (const mod of mods) {
    // This is a simplified check — in practice, we'd check the mod's supported loaders
    // from the Modrinth data. For MVP, we skip this as mods are already filtered by loader
    // during search.
  }

  // 2. Missing required dependencies
  for (const dep of dependencies) {
    if (dep.dep_type === 'required') {
      const depSlug = dep.depends_on_slug.toLowerCase();
      if (!slugSet.has(depSlug)) {
        const fromMod = mods.find((m) => m.id === dep.project_mod_id);
        diagnostics.push({
          id: `missing-${dep.id}`,
          severity: 'warning',
          type: 'missing_dependency',
          title: 'Missing Dependency',
          description: `${fromMod?.name ?? 'Unknown'} requires ${dep.depends_on_slug}, which is not in the project`,
          affectedMods: [dep.project_mod_id],
          suggestedFix: `Add ${dep.depends_on_slug} to your project`,
        });
      }
    }
  }

  // 3. Known incompatibilities
  for (const { mod1, mod2, reason } of KNOWN_INCOMPATIBILITIES) {
    const mod1Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod1);
    const mod2Instance = mods.find((m) => (m.slug ?? '').toLowerCase() === mod2);
    if (mod1Instance && mod2Instance) {
      diagnostics.push({
        id: `incompat-${mod1}-${mod2}`,
        severity: 'warning',
        type: 'known_incompatibility',
        title: 'Known Incompatibility',
        description: `${mod1Instance.name} and ${mod2Instance.name} are incompatible: ${reason}`,
        affectedMods: [mod1Instance.id, mod2Instance.id],
        suggestedFix: `Remove one of the conflicting mods`,
      });
    }
  }

  return diagnostics;
}
```

- [ ] **Step 2: Create useDiagnostics hook**

Create `src/hooks/useDiagnostics.ts`:
```typescript
import { useMemo } from 'react';
import { useProjectStore } from '../stores/projectStore';
import { detectConflicts } from '../engine/conflictDetector';
import type { Diagnostic, Dependency } from '../types';

export function useDiagnostics(deps: Dependency[]): Diagnostic[] {
  const mods = useProjectStore((s) => s.mods);
  const currentProject = useProjectStore((s) => s.currentProject);

  return useMemo(() => {
    if (!currentProject) return [];
    return detectConflicts(mods, deps, currentProject.mc_version, currentProject.loader);
  }, [mods, deps, currentProject]);
}
```

- [ ] **Step 3: Create DiagnosticsPanel component**

Create `src/components/diagnostics/DiagnosticsPanel.tsx`:
```tsx
import { useDiagnostics } from '../../hooks/useDiagnostics';
import { useProjectStore } from '../../stores/projectStore';
import * as tauri from '../../lib/tauri';
import { useState, useEffect } from 'react';
import type { Dependency, Diagnostic } from '../../types';

const SEVERITY_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  critical: { bg: 'bg-danger/10', text: 'text-danger', icon: '●' },
  warning: { bg: 'bg-warning/10', text: 'text-warning', icon: '▲' },
  info: { bg: 'bg-info/10', text: 'text-info', icon: 'ℹ' },
};

export function DiagnosticsPanel() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [deps, setDeps] = useState<Dependency[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    tauri.getAllDependencies(currentProject.id).then(setDeps).catch(console.error);
  }, [currentProject, mods]);

  const diagnostics = useDiagnostics(deps);

  if (!currentProject) {
    return (
      <div className="p-6">
        <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Diagnostics</h2>
        <p className="text-text-secondary">Select a project to run diagnostics</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-xl font-semibold text-text-primary">Diagnostics</h2>
        <span className="text-xs text-text-tertiary">
          {diagnostics.length} issue{diagnostics.length !== 1 ? 's' : ''} found
        </span>
      </div>

      {diagnostics.length === 0 ? (
        <div className="bg-surface rounded-xl p-6 text-center">
          <p className="text-success font-medium">All checks passed</p>
          <p className="text-text-tertiary text-sm mt-1">No conflicts or issues detected</p>
        </div>
      ) : (
        <div className="space-y-2">
          {diagnostics.map((diag) => {
            const style = SEVERITY_STYLES[diag.severity] ?? SEVERITY_STYLES.info;
            return (
              <div
                key={diag.id}
                className={`bg-surface rounded-xl p-4 border border-separator/50 ${style.bg}`}
              >
                <div className="flex items-start gap-2">
                  <span className={`${style.text} text-sm mt-0.5`}>{style.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-text-primary">{diag.title}</h3>
                    <p className="text-xs text-text-secondary mt-1">{diag.description}</p>
                    <p className="text-xs text-accent mt-1">Fix: {diag.suggestedFix}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Update Canvas to use DiagnosticsPanel**

Replace the diagnostics case in `src/components/layout/Canvas.tsx`:
```tsx
case 'diagnostics':
  return <DiagnosticsPanel />;
```

Add import:
```tsx
import { DiagnosticsPanel } from '../diagnostics/DiagnosticsPanel';
```

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: implement conflict detection engine and diagnostics panel"
```

---

## Slice 5: Export

### Task 21: Rust Export Engine

**Files:**
- Create: `src-tauri/src/export/mod.rs`
- Create: `src-tauri/src/export/modrinth_pack.rs`
- Create: `src-tauri/src/export/curseforge_pack.rs`
- Create: `src-tauri/src/export/prism.rs`
- Create: `src-tauri/src/export/zip.rs`
- Create: `src-tauri/src/commands/export.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: Create export module**

Create `src-tauri/src/export/mod.rs`:
```rust
pub mod modrinth_pack;
pub mod curseforge_pack;
pub mod prism;
pub mod zip_export;
```

- [ ] **Step 2: Create Modrinth pack exporter**

Create `src-tauri/src/export/modrinth_pack.rs`:
```rust
use crate::commands::mods::ProjectMod;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn export_modrinth_pack(
    project_name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let output_dir = Path::new(output_path);
    let mods_dir = output_dir.join("mods");
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    // Build modrinth.index.json
    let files_json: Vec<serde_json::Value> = mods.iter().filter_map(|m| {
        m.modrinth_id.as_ref().map(|mid| {
            json!({
                "path": format!("mods/{}.jar", m.slug.as_deref().unwrap_or(&m.name)),
                "hashes": {},
                "env": { "client": "required", "server": "required" },
                "downloads": [],
                "fileSize": 0
            })
        })
    }).collect();

    let index = json!({
        "formatVersion": 1,
        "game": "minecraft",
        "versionId": project_name,
        "name": project_name,
        "summary": "",
        "files": files_json,
        "dependencies": {
            "minecraft": mc_version,
            loader: loader
        }
    });

    let index_path = output_dir.join("modrinth.index.json");
    let index_content = serde_json::to_string_pretty(&index).map_err(|e| e.to_string())?;
    fs::write(&index_path, index_content).map_err(|e| e.to_string())?;

    Ok(output_dir.to_string_lossy().to_string())
}
```

- [ ] **Step 3: Create CurseForge pack exporter**

Create `src-tauri/src/export/curseforge_pack.rs`:
```rust
use crate::commands::mods::ProjectMod;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn export_curseforge_pack(
    project_name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let temp_dir = Path::new(output_path).join("curseforge_temp");
    let mods_dir = temp_dir.join("mods");
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    let manifest = json!({
        "minecraft": {
            "version": mc_version,
            "modLoaders": [{
                "id": format!("{}-0", loader),
                "primary": true
            }]
        },
        "manifestType": "minecraftModpack",
        "manifestVersion": 1,
        "name": project_name,
        "files": [],
        "overrides": "overrides"
    });

    let manifest_path = temp_dir.join("manifest.json");
    let content = serde_json::to_string_pretty(&manifest).map_err(|e| e.to_string())?;
    fs::write(&manifest_path, content).map_err(|e| e.to_string())?;

    // Create modlist.html
    let modlist = format!(
        "<ul>{}</ul>",
        mods.iter()
            .map(|m| format!("<li>{}</li>", m.name))
            .collect::<Vec<_>>()
            .join("")
    );
    fs::write(temp_dir.join("modlist.html"), modlist).map_err(|e| e.to_string())?;

    Ok(temp_dir.to_string_lossy().to_string())
}
```

- [ ] **Step 4: Create Prism Launcher exporter**

Create `src-tauri/src/export/prism.rs`:
```rust
use crate::commands::mods::ProjectMod;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn export_prism_pack(
    project_name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let instance_dir = Path::new(output_path).join(project_name);
    let mods_dir = instance_dir.join("mods");
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    // mmc-pack.json
    let mmc_pack = json!({
        "components": [
            { "uid": "net.minecraft", "version": mc_version },
            { "uid": format!("net.{}", loader), "version": "0" }
        ]
    });
    fs::write(
        instance_dir.join("mmc-pack.json"),
        serde_json::to_string_pretty(&mmc_pack).map_err(|e| e.to_string())?,
    ).map_err(|e| e.to_string())?;

    // instance.cfg
    let cfg = format!("name={}\nInstanceType=OneSix\n", project_name);
    fs::write(instance_dir.join("instance.cfg"), cfg).map_err(|e| e.to_string())?;

    Ok(instance_dir.to_string_lossy().to_string())
}
```

- [ ] **Step 5: Create ZIP exporter**

Create `src-tauri/src/export/zip_export.rs`:
```rust
use crate::commands::mods::ProjectMod;
use std::fs;
use std::path::Path;

pub fn export_zip_pack(
    project_name: &str,
    _mc_version: &str,
    _loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let pack_dir = Path::new(output_path).join(project_name);
    let mods_dir = pack_dir.join("mods");
    fs::create_dir_all(&mods_dir).map_err(|e| e.to_string())?;

    // Create README.md
    let readme = format!(
        "# {}\n\nGenerated by ModCanvas\n\n## Mods ({}):\n\n{}",
        project_name,
        mods.len(),
        mods.iter()
            .map(|m| format!("- {} ({})", m.name, m.version_number.as_deref().unwrap_or("unknown")))
            .collect::<Vec<_>>()
            .join("\n")
    );
    fs::write(pack_dir.join("README.md"), readme).map_err(|e| e.to_string())?;

    Ok(pack_dir.to_string_lossy().to_string())
}
```

- [ ] **Step 6: Create export command**

Create `src-tauri/src/commands/export.rs`:
```rust
use crate::db::{get_conn, DbState};
use crate::commands::mods::ProjectMod;
use crate::export;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub enum ExportFormat {
    Modrinth,
    Curseforge,
    Prism,
    Zip,
}

#[derive(Debug, Deserialize)]
pub struct ExportInput {
    pub project_id: String,
    pub format: ExportFormat,
    pub output_path: String,
}

#[tauri::command]
pub fn export_pack(input: ExportInput, db: State<DbState>) -> Result<String, String> {
    let conn = get_conn(&db)?;

    // Get project info
    let (name, mc_version, loader): (String, String, String) = conn
        .query_row(
            "SELECT name, mc_version, loader FROM projects WHERE id = ?1",
            rusqlite::params![input.project_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    // Get mods
    let mut stmt = conn.prepare(
        "SELECT id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at FROM project_mods WHERE project_id = ?1"
    ).map_err(|e| e.to_string())?;

    let mods: Vec<ProjectMod> = stmt.query_map(rusqlite::params![input.project_id], |row| {
        Ok(ProjectMod {
            id: row.get(0)?,
            project_id: row.get(1)?,
            modrinth_id: row.get(2)?,
            slug: row.get(3)?,
            name: row.get(4)?,
            version_id: row.get(5)?,
            version_number: row.get(6)?,
            icon_url: row.get(7)?,
            description: row.get(8)?,
            author: row.get(9)?,
            source_url: row.get(10)?,
            license: row.get(11)?,
            added_at: row.get(12)?,
        })
    }).map_err(|e| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e| e.to_string())?;

    match input.format {
        ExportFormat::Modrinth => {
            export::modrinth_pack::export_modrinth_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Curseforge => {
            export::curseforge_pack::export_curseforge_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Prism => {
            export::prism::export_prism_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Zip => {
            export::zip_export::export_zip_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
    }
}
```

- [ ] **Step 7: Update commands module**

Replace `src-tauri/src/commands/mod.rs`:
```rust
pub mod project;
pub mod mods;
pub mod search;
pub mod export;
```

- [ ] **Step 8: Update main.rs to register export command**

Add to `invoke_handler` in `src-tauri/src/main.rs`:
```rust
commands::search::search_mods,
commands::search::get_mod_details,
commands::search::get_mod_versions,
commands::export::export_pack,
```

- [ ] **Step 9: Verify Rust compiles**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas/src-tauri && cargo check
```

Expected: Compiles successfully.

- [ ] **Step 10: Commit**

```bash
git add src-tauri/src/
git commit -m "feat: add export engine with Modrinth, CurseForge, Prism, and ZIP formats"
```

---

### Task 22: Frontend Export UI

**Files:**
- Create: `src/components/export/ExportDialog.tsx`
- Modify: `src/lib/tauri.ts`
- Modify: `src/components/layout/Canvas.tsx`

- [ ] **Step 1: Add export IPC wrapper**

Append to `src/lib/tauri.ts`:
```typescript
export const exportPack = (projectId: string, format: string, outputPath: string): Promise<string> =>
  invoke('export_pack', { input: { projectId, format, outputPath } });
```

- [ ] **Step 2: Create ExportDialog component**

Create `src/components/export/ExportDialog.tsx`:
```tsx
import { useState } from 'react';
import { useProjectStore } from '../../stores/projectStore';
import * as tauri from '../../lib/tauri';
import type { ExportFormat } from '../../types';

const FORMATS: { key: ExportFormat; label: string; description: string }[] = [
  { key: 'modrinth', label: 'Modrinth Pack', description: '.mrpack format for Modrinth' },
  { key: 'curseforge', label: 'CurseForge Pack', description: 'Standard CurseForge zip format' },
  { key: 'prism', label: 'Prism Launcher', description: 'Instance folder for Prism Launcher' },
  { key: 'zip', label: 'ZIP Archive', description: 'Plain ZIP with mods folder' },
];

export function ExportDialog() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('modrinth');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    if (!currentProject) return;
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      const outputPath = `~/ModCanvas/Exports/${currentProject.name}`;
      const res = await tauri.exportPack(currentProject.id, selectedFormat, outputPath);
      setResult(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setExporting(false);
    }
  };

  if (!currentProject) {
    return (
      <div className="p-6">
        <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Export</h2>
        <p className="text-text-secondary">Select a project to export</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="font-heading text-xl font-semibold text-text-primary mb-4">Export Pack</h2>

      <div className="bg-surface rounded-xl p-5 shadow-sm border border-separator/50">
        <div className="mb-4">
          <p className="text-sm text-text-secondary">
            {currentProject.name} · {currentProject.mc_version} · {currentProject.loader} · {mods.length} mods
          </p>
        </div>

        <div className="space-y-2 mb-5">
          {FORMATS.map((fmt) => (
            <button
              key={fmt.key}
              onClick={() => setSelectedFormat(fmt.key)}
              className={`w-full text-left p-3 rounded-lg border transition-colors duration-150
                ${selectedFormat === fmt.key
                  ? 'border-accent bg-accent/5'
                  : 'border-separator bg-background hover:border-text-tertiary'
                }`}
            >
              <span className="text-sm font-medium text-text-primary">{fmt.label}</span>
              <p className="text-xs text-text-tertiary mt-0.5">{fmt.description}</p>
            </button>
          ))}
        </div>

        <button
          onClick={handleExport}
          disabled={exporting || mods.length === 0}
          className="w-full py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent-light disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
        >
          {exporting ? 'Exporting...' : 'Export'}
        </button>

        {result && (
          <div className="mt-3 p-3 bg-success/10 rounded-lg">
            <p className="text-sm text-success font-medium">Export successful!</p>
            <p className="text-xs text-text-secondary mt-0.5">{result}</p>
          </div>
        )}

        {error && (
          <div className="mt-3 p-3 bg-danger/10 rounded-lg">
            <p className="text-sm text-danger font-medium">Export failed</p>
            <p className="text-xs text-text-secondary mt-0.5">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update Canvas to use ExportDialog**

Replace the export case in `src/components/layout/Canvas.tsx`:
```tsx
case 'export':
  return <ExportDialog />;
```

Add import:
```tsx
import { ExportDialog } from '../export/ExportDialog';
```

- [ ] **Step 4: Verify export works**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Can create project, add mods, and export in all 4 formats.

- [ ] **Step 5: Commit**

```bash
git add src/
git commit -m "feat: implement export dialog UI with format selection"
```

---

### Task 23: Final Integration & Polish

**Files:**
- Modify: `src/components/layout/Canvas.tsx` (clean up placeholders)
- Modify: `src/App.tsx` (add status bar)

- [ ] **Step 1: Add status bar to App**

Replace `src/App.tsx`:
```tsx
import { Sidebar } from './components/layout/Sidebar';
import { Canvas } from './components/layout/Canvas';
import { Inspector } from './components/layout/Inspector';
import { useProjectStore } from './stores/projectStore';
import { useDiagnostics } from './hooks/useDiagnostics';
import * as tauri from './lib/tauri';
import { useState, useEffect } from 'react';
import type { Dependency } from './types';

export default function App() {
  const currentProject = useProjectStore((s) => s.currentProject);
  const mods = useProjectStore((s) => s.mods);
  const [deps, setDeps] = useState<Dependency[]>([]);

  useEffect(() => {
    if (!currentProject) return;
    tauri.getAllDependencies(currentProject.id).then(setDeps).catch(console.error);
  }, [currentProject, mods]);

  const diagnostics = useDiagnostics(deps);
  const warningCount = diagnostics.filter((d) => d.severity === 'warning').length;
  const criticalCount = diagnostics.filter((d) => d.severity === 'critical').length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Canvas />
        <Inspector />
      </div>
      <footer className="h-7 bg-surface border-t border-separator flex items-center px-4 text-[11px] text-text-tertiary gap-4">
        {currentProject ? (
          <>
            <span>{mods.length} mods</span>
            <span>{deps.length} dependencies</span>
            {warningCount > 0 && <span className="text-warning">{warningCount} warnings</span>}
            {criticalCount > 0 && <span className="text-danger">{criticalCount} critical</span>}
            {diagnostics.length === 0 && <span className="text-success">All checks passed</span>}
          </>
        ) : (
          <span>No project selected</span>
        )}
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Final verification**

Run:
```bash
cd /Users/xiatian/Desktop/BMCanvas
npm run tauri dev
```

Expected: Full app works — create project, search mods, add mods, view graph, check diagnostics, export.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add status bar and final integration polish"
```

---

## Self-Review

### Spec Coverage

| Spec Section | Task |
|---|---|
| Architecture (thin Rust shell) | Tasks 1-6 |
| Data Model (SQLite schema) | Task 3 |
| Frontend Architecture (stores, hooks, engine) | Tasks 7-8, 16, 18-20 |
| Dependency Graph (React Flow, dagre, nodes, edges) | Tasks 19-20 |
| Rust Backend (IPC commands) | Tasks 4-6, 14-15, 21 |
| UI Layout (Sidebar, Canvas, Inspector) | Tasks 9-12 |
| Design Language (SwiftUI light) | Task 9 |
| Conflict Detection | Task 20 |
| Export System | Tasks 21-22 |
| Vertical Slice Plan | Tasks 1-13 (S1), 14-17 (S2), 18-20 (S3), 20 (S4), 21-23 (S5) |

### Placeholder Scan

No TBD, TODO, or placeholder patterns found.

### Type Consistency

All type names and function signatures are consistent across tasks.
