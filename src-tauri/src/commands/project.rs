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
    ).map_err(|e: rusqlite::Error| e.to_string())?;

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
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let projects = stmt.query_map([], |row: &rusqlite::Row| {
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
    }).map_err(|e: rusqlite::Error| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(projects)
}

#[tauri::command]
pub fn get_project(id: String, db: State<DbState>) -> Result<Project, String> {
    let conn = get_conn(&db)?;
    conn.query_row(
        "SELECT id, name, description, mc_version, loader, author, tags, created_at, updated_at FROM projects WHERE id = ?1",
        rusqlite::params![id],
        |row: &rusqlite::Row| {
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
    ).map_err(|e: rusqlite::Error| e.to_string())
}

#[tauri::command]
pub fn delete_project(id: String, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;
    conn.execute("DELETE FROM projects WHERE id = ?1", rusqlite::params![id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(())
}
