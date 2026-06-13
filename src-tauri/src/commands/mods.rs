use crate::db::{get_conn, DbState};
use crate::commands::project::Project;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;
use std::path::Path;
use std::fs;
use std::io::Read;

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
    pub homepage_url: Option<String>,
    pub supported_mc_versions: Option<Vec<String>>,
    pub changelog: Option<String>,
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
    pub homepage_url: Option<String>,
    pub supported_mc_versions: Option<Vec<String>>,
    pub changelog: Option<String>,
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

    let supported_mc_versions_json = input.supported_mc_versions
        .as_ref()
        .map(|v| serde_json::to_string(v).unwrap_or_else(|_| "[]".to_string()))
        .unwrap_or_else(|| "[]".to_string());

    conn.execute(
        "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at, homepage_url, changelog, supported_mc_versions)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16)",
        rusqlite::params![id, project_id, input.modrinth_id, input.slug, input.name, input.version_id, input.version_number, input.icon_url, input.description, input.author, input.source_url, input.license, now, input.homepage_url, input.changelog, supported_mc_versions_json],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    conn.execute("UPDATE projects SET updated_at = ?1 WHERE id = ?2", rusqlite::params![now, project_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;

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
        homepage_url: input.homepage_url,
        supported_mc_versions: input.supported_mc_versions,
        changelog: input.changelog,
    })
}

#[tauri::command]
pub fn remove_mod_from_project(project_id: String, mod_id: String, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;
    let now = Utc::now().timestamp_millis();

    conn.execute("DELETE FROM dependencies WHERE project_mod_id = ?1", rusqlite::params![mod_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    conn.execute("DELETE FROM project_mods WHERE id = ?1 AND project_id = ?2", rusqlite::params![mod_id, project_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    conn.execute("UPDATE projects SET updated_at = ?1 WHERE id = ?2", rusqlite::params![now, project_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn list_project_mods(project_id: String, db: State<DbState>) -> Result<Vec<ProjectMod>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at, homepage_url, changelog, supported_mc_versions FROM project_mods WHERE project_id = ?1 ORDER BY name"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let mods = stmt.query_map(rusqlite::params![project_id], |row: &rusqlite::Row| {
        let homepage_url: Option<String> = row.get(13)?;
        let changelog: Option<String> = row.get(14)?;
        let supported_mc_versions_str: String = row.get(15).unwrap_or_default();
        let supported_mc_versions: Vec<String> = serde_json::from_str(&supported_mc_versions_str).unwrap_or_default();
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
            homepage_url,
            supported_mc_versions: Some(supported_mc_versions),
            changelog,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(mods)
}

#[tauri::command]
pub fn save_dependencies(mod_id: String, deps: Vec<DepInput>, db: State<DbState>) -> Result<(), String> {
    let conn = get_conn(&db)?;

    conn.execute("DELETE FROM dependencies WHERE project_mod_id = ?1", rusqlite::params![mod_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;

    for dep in deps {
        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO dependencies (id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, mod_id, dep.depends_on_slug, dep.dep_type, dep.dep_modrinth_id],
        ).map_err(|e: rusqlite::Error| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn get_dependencies(mod_id: String, db: State<DbState>) -> Result<Vec<Dependency>, String> {
    let conn = get_conn(&db)?;
    let mut stmt = conn.prepare(
        "SELECT id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id FROM dependencies WHERE project_mod_id = ?1"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let deps = stmt.query_map(rusqlite::params![mod_id], |row: &rusqlite::Row| {
        Ok(Dependency {
            id: row.get(0)?,
            project_mod_id: row.get(1)?,
            depends_on_slug: row.get(2)?,
            dep_type: row.get(3)?,
            dep_modrinth_id: row.get(4)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e: rusqlite::Error| e.to_string())?;

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
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let deps = stmt.query_map(rusqlite::params![project_id], |row: &rusqlite::Row| {
        Ok(Dependency {
            id: row.get(0)?,
            project_mod_id: row.get(1)?,
            depends_on_slug: row.get(2)?,
            dep_type: row.get(3)?,
            dep_modrinth_id: row.get(4)?,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e: rusqlite::Error| e.to_string())?;

    Ok(deps)
}

#[tauri::command]
pub async fn fetch_and_save_dependencies(
    modrinth_id: String,
    mc_version: String,
    loader: String,
    project_mod_id: String,
    client: State<'_, crate::commands::search::ModrinthState>,
    db: State<'_, DbState>,
) -> Result<Vec<Dependency>, String> {
    let versions = client.0.get_versions(&modrinth_id, Some(&mc_version), Some(&loader)).await?;

    let version = versions.into_iter().next()
        .ok_or_else(|| format!("No version found for {} matching MC {} and {}", modrinth_id, mc_version, loader))?;

    let conn = get_conn(&db)?;

    conn.execute("DELETE FROM dependencies WHERE project_mod_id = ?1", rusqlite::params![project_mod_id])
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut result_deps = Vec::new();
    for dep in &version.dependencies {
        let dep_type = dep.dependency_type.clone().unwrap_or_default();
        let slug = dep.project_id.clone().unwrap_or_default();
        let dep_modrinth_id = dep.project_id.clone();

        let id = Uuid::new_v4().to_string();
        conn.execute(
            "INSERT INTO dependencies (id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            rusqlite::params![id, project_mod_id, slug, dep_type, dep_modrinth_id],
        ).map_err(|e: rusqlite::Error| e.to_string())?;

        result_deps.push(Dependency {
            id,
            project_mod_id: project_mod_id.clone(),
            depends_on_slug: slug,
            dep_type,
            dep_modrinth_id,
        });
    }

    Ok(result_deps)
}

#[tauri::command]
pub async fn import_modpack(
    file_path: String,
    db: State<'_, DbState>,
) -> Result<Project, String> {
    let path = Path::new(&file_path);
    let filename = path.file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("Imported Pack")
        .to_string();

    if file_path.ends_with(".mrpack") || is_modrinth_pack(path) {
        import_modrinth_pack(path, &filename, &db)
    } else if is_curseforge_pack(path) {
        import_curseforge_pack(path, &filename, &db)
    } else if is_prism_instance(path) {
        import_prism_instance(path, &filename, &db)
    } else {
        Err("Unknown modpack format".to_string())
    }
}

fn is_modrinth_pack(path: &Path) -> bool {
    if let Ok(file) = fs::File::open(path) {
        if let Ok(mut archive) = zip::ZipArchive::new(file) {
            return archive.by_name("modrinth.index.json").is_ok();
        }
    }
    false
}

fn is_curseforge_pack(path: &Path) -> bool {
    if let Ok(file) = fs::File::open(path) {
        if let Ok(mut archive) = zip::ZipArchive::new(file) {
            return archive.by_name("manifest.json").is_ok();
        }
    }
    false
}

fn is_prism_instance(path: &Path) -> bool {
    path.is_dir() && path.join("mmc-pack.json").exists()
}

fn import_modrinth_pack(path: &Path, filename: &str, db: &State<'_, DbState>) -> Result<Project, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut index_json = String::new();
    let mut index_file = archive.by_name("modrinth.index.json").map_err(|e| e.to_string())?;
    index_file.read_to_string(&mut index_json).map_err(|e| e.to_string())?;

    let index: serde_json::Value = serde_json::from_str(&index_json).map_err(|e| e.to_string())?;

    let name = index["name"].as_str().unwrap_or(filename).to_string();
    let deps = &index["dependencies"];
    let mc_version = deps["minecraft"].as_str().unwrap_or("1.21.1").to_string();
    let loader = if deps.get("neoforge").is_some() { "neoforge" }
        else if deps.get("forge").is_some() { "forge" }
        else if deps.get("fabric-loader").is_some() { "fabric" }
        else if deps.get("quilt-loader").is_some() { "quilt" }
        else { "forge" };

    let conn = get_conn(db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    conn.execute(
        "INSERT INTO projects (id, name, description, mc_version, loader, author, tags, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![id, name, "", mc_version, loader, "", "[]", now, now],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(files) = index["files"].as_array() {
        for file_entry in files {
            let path_str = file_entry["path"].as_str().unwrap_or("");
            if path_str.starts_with("mods/") && path_str.ends_with(".jar") {
                let mod_name = path_str.trim_start_matches("mods/")
                    .trim_end_matches(".jar")
                    .to_string();

                // Try to extract modrinth_id from download URL
                // Format: https://cdn.modrinth.com/data/{project_id}/versions/...
                let mut modrinth_id = String::new();
                if let Some(downloads) = file_entry["downloads"].as_array() {
                    if let Some(url) = downloads.first().and_then(|u| u.as_str()) {
                        if url.starts_with("https://cdn.modrinth.com/data/") {
                            let parts: Vec<&str> = url.split('/').collect();
                            // /data/{project_id}/versions/...
                            if let Some(data_idx) = parts.iter().position(|p| *p == "data") {
                                if data_idx + 1 < parts.len() {
                                    modrinth_id = parts[data_idx + 1].to_string();
                                }
                            }
                        }
                    }
                }

                // Use modrinth_id as slug if available, otherwise derive from filename
                let slug = if modrinth_id.is_empty() {
                    mod_name.replace('-', "")
                } else {
                    modrinth_id.clone()
                };

                let mod_id = Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                    rusqlite::params![mod_id, id, if modrinth_id.is_empty() { "" } else { &modrinth_id }, slug, mod_name, "", "", "", "", "", "", "", now],
                );
            }
        }
    }

    Ok(Project {
        id,
        name,
        description: String::new(),
        mc_version,
        loader: loader.to_string(),
        author: String::new(),
        tags: "[]".to_string(),
        created_at: now,
        updated_at: now,
    })
}

fn import_curseforge_pack(path: &Path, filename: &str, db: &State<'_, DbState>) -> Result<Project, String> {
    let file = fs::File::open(path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    let mut manifest_json = String::new();
    let mut manifest_file = archive.by_name("manifest.json").map_err(|e| e.to_string())?;
    manifest_file.read_to_string(&mut manifest_json).map_err(|e| e.to_string())?;

    let manifest: serde_json::Value = serde_json::from_str(&manifest_json).map_err(|e| e.to_string())?;

    let name = manifest["name"].as_str().unwrap_or(filename).to_string();
    let mc_version = manifest["minecraft"]["version"].as_str().unwrap_or("1.21.1").to_string();
    let loaders = manifest["minecraft"]["modLoaders"].as_array();
    let loader = loaders.and_then(|l| l.first())
        .and_then(|l| l["id"].as_str())
        .map(|s| {
            if s.starts_with("neoforge") { "neoforge" }
            else if s.starts_with("forge") { "forge" }
            else if s.starts_with("fabric") { "fabric" }
            else if s.starts_with("quilt") { "quilt" }
            else { "forge" }
        })
        .unwrap_or("forge");

    let conn = get_conn(db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    conn.execute(
        "INSERT INTO projects (id, name, description, mc_version, loader, author, tags, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![id, name, "", mc_version, loader, "", "[]", now, now],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    if let Some(files) = manifest["files"].as_array() {
        for file_entry in files {
            let project_id = file_entry["projectID"].as_i64().unwrap_or(0);
            let mod_id = Uuid::new_v4().to_string();
            let _ = conn.execute(
                "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                rusqlite::params![mod_id, id, "", format!("curseforge-{}", project_id), format!("CF Mod #{}", project_id), "", "", "", "", "", "", "", now],
            );
        }
    }

    Ok(Project {
        id,
        name,
        description: String::new(),
        mc_version,
        loader: loader.to_string(),
        author: String::new(),
        tags: "[]".to_string(),
        created_at: now,
        updated_at: now,
    })
}

fn import_prism_instance(path: &Path, filename: &str, db: &State<'_, DbState>) -> Result<Project, String> {
    let mmc_pack = fs::read_to_string(path.join("mmc-pack.json")).map_err(|e| e.to_string())?;
    let pack: serde_json::Value = serde_json::from_str(&mmc_pack).map_err(|e| e.to_string())?;

    let components = pack["components"].as_array();
    let mut mc_version = "1.21.1".to_string();
    let mut loader = "forge";

    if let Some(comps) = components {
        for comp in comps {
            let uid = comp["uid"].as_str().unwrap_or("");
            if uid == "net.minecraft" {
                mc_version = comp["version"].as_str().unwrap_or("1.21.1").to_string();
            } else if uid.contains("neoforged") { loader = "neoforge"; }
            else if uid.contains("forge") { loader = "forge"; }
            else if uid.contains("fabric") { loader = "fabric"; }
            else if uid.contains("quilt") { loader = "quilt"; }
        }
    }

    let name = fs::read_to_string(path.join("instance.cfg"))
        .ok()
        .and_then(|cfg| {
            cfg.lines().find(|l| l.starts_with("name=")).map(|l| l.trim_start_matches("name=").to_string())
        })
        .unwrap_or_else(|| filename.to_string());

    let conn = get_conn(db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    conn.execute(
        "INSERT INTO projects (id, name, description, mc_version, loader, author, tags, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![id, name, "", mc_version, loader, "", "[]", now, now],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let mods_dir = path.join(".minecraft").join("mods");
    if mods_dir.exists() {
        if let Ok(entries) = fs::read_dir(&mods_dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.extension().and_then(|e| e.to_str()) == Some("jar") {
                    let mod_name = p.file_stem()
                        .and_then(|n| n.to_str())
                        .unwrap_or("unknown")
                        .to_string();
                    let mod_id = Uuid::new_v4().to_string();
                    let _ = conn.execute(
                        "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
                        rusqlite::params![mod_id, id, "", mod_name.replace('-', ""), mod_name, "", "", "", "", "", "", "", now],
                    );
                }
            }
        }
    }

    Ok(Project {
        id,
        name,
        description: String::new(),
        mc_version,
        loader: loader.to_string(),
        author: String::new(),
        tags: "[]".to_string(),
        created_at: now,
        updated_at: now,
    })
}
