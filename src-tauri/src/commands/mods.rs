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
