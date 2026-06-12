use crate::modrinth::client::ModrinthClient;
use crate::modrinth::types::*;
use crate::commands::project::Project;
use crate::db::{get_conn, DbState};
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;
use chrono::Utc;

pub struct ModrinthState(pub ModrinthClient);

#[derive(Debug, Deserialize)]
pub struct SearchFilters {
    pub loaders: Option<Vec<String>>,
    pub game_versions: Option<Vec<String>>,
}

/// A mod inside a modpack (for preview)
#[derive(Debug, Serialize, Clone)]
pub struct ModpackMod {
    pub project_id: String,
    pub name: String,
    pub slug: Option<String>,
    pub icon_url: Option<String>,
    pub description: Option<String>,
    pub dep_type: String,
}

/// Modpack content preview result
#[derive(Debug, Serialize)]
pub struct ModpackContent {
    pub name: String,
    pub description: Option<String>,
    pub mc_version: String,
    pub loader: String,
    pub icon_url: Option<String>,
    pub downloads: i64,
    pub mods: Vec<ModpackMod>,
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

#[tauri::command]
pub async fn search_modpacks(
    query: String,
    game_versions: Option<Vec<String>>,
    limit: Option<u32>,
    offset: Option<u32>,
    client: State<'_, ModrinthState>,
) -> Result<SearchResponse, String> {
    client.0.search_modpacks(&query, game_versions, limit, offset).await
}

/// Preview the contents (mods) of a Modrinth modpack without importing
#[tauri::command]
pub async fn get_modpack_contents(
    modrinth_id: String,
    client: State<'_, ModrinthState>,
) -> Result<ModpackContent, String> {
    let project = client.0.get_project(&modrinth_id).await?;

    let versions = client.0.get_versions(&modrinth_id, None, None).await?;
    let latest = versions.first();

    let mc_version = latest
        .and_then(|v| v.game_versions.first().cloned())
        .unwrap_or_else(|| "1.21.1".to_string());
    let loader = latest
        .and_then(|v| v.loaders.first().cloned())
        .unwrap_or_else(|| "forge".to_string());

    let mut mods: Vec<ModpackMod> = Vec::new();

    if let Some(ver) = latest {
        for dep in &ver.dependencies {
            let dep_type = dep.dependency_type.as_deref().unwrap_or("");
            if dep_type == "required" || dep_type == "optional" {
                if let Some(dep_project_id) = &dep.project_id {
                    let dep_project = client.0.get_project(dep_project_id).await.ok();
                    mods.push(ModpackMod {
                        project_id: dep_project_id.clone(),
                        name: dep_project.as_ref().map(|p| p.title.clone()).unwrap_or_else(|| dep_project_id.clone()),
                        slug: dep_project.as_ref().and_then(|p| p.slug.clone()),
                        icon_url: dep_project.as_ref().and_then(|p| p.icon_url.clone()),
                        description: dep_project.as_ref().and_then(|p| p.description.clone()),
                        dep_type: dep_type.to_string(),
                    });
                }
            }
        }
    }

    Ok(ModpackContent {
        name: project.title,
        description: project.description,
        mc_version,
        loader,
        icon_url: project.icon_url,
        downloads: project.downloads,
        mods,
    })
}

#[tauri::command]
pub async fn import_modpack_from_modrinth(
    modrinth_id: String,
    db: State<'_, DbState>,
    client: State<'_, ModrinthState>,
) -> Result<Project, String> {
    let project = client.0.get_project(&modrinth_id).await?;

    let name = project.title.clone();
    let description = project.description.clone().unwrap_or_default();

    let versions = client.0.get_versions(&modrinth_id, None, None).await?;
    let latest = versions.first();

    let mc_version = latest
        .and_then(|v| v.game_versions.first().cloned())
        .unwrap_or_else(|| "1.21.1".to_string());
    let loader = latest
        .and_then(|v| v.loaders.first().cloned())
        .unwrap_or_else(|| "forge".to_string());
    let loader_str = match loader.as_str() {
        "neoforge" => "neoforge",
        "forge" => "forge",
        "fabric" => "fabric",
        "quilt" => "quilt",
        _ => "forge",
    };

    // Collect dependency info before acquiring DB lock
    struct DepInfo {
        project_id: String,
        name: String,
        slug: String,
        desc: String,
        icon: String,
        source: String,
        license: String,
        version_id: Option<String>,
        version_number: Option<String>,
        // Dependencies of this mod (from the modpack version)
        mod_deps: Vec<(String, String, Option<String>)>, // (slug, dep_type, dep_modrinth_id)
    }
    let mut dep_infos: Vec<DepInfo> = Vec::new();

    if let Some(ver) = latest {
        for dep in &ver.dependencies {
            let dep_type = dep.dependency_type.as_deref().unwrap_or("");
            if dep_type == "required" || dep_type == "optional" {
                if let Some(dep_project_id) = &dep.project_id {
                    let dep_project = client.0.get_project(dep_project_id).await.ok();

                    // Try to get version info for this dependency mod
                    let mut version_id: Option<String> = None;
                    let mut version_number: Option<String> = None;
                    let mut mod_deps: Vec<(String, String, Option<String>)> = Vec::new();

                    if let Ok(mod_versions) = client.0.get_versions(dep_project_id, Some(&mc_version), Some(&loader_str)).await {
                        if let Some(mod_ver) = mod_versions.first() {
                            version_id = Some(mod_ver.id.clone());
                            version_number = mod_ver.version_number.clone();
                            // Collect this mod's own dependencies
                            for md in &mod_ver.dependencies {
                                let md_type = md.dependency_type.as_deref().unwrap_or("");
                                if md_type == "required" || md_type == "optional" {
                                    let md_slug = md.project_id.clone().unwrap_or_default();
                                    mod_deps.push((md_slug, md_type.to_string(), md.project_id.clone()));
                                }
                            }
                        }
                    }

                    dep_infos.push(DepInfo {
                        project_id: dep_project_id.clone(),
                        name: dep_project.as_ref().map(|p| p.title.clone()).unwrap_or_else(|| dep_project_id.clone()),
                        slug: dep_project.as_ref().and_then(|p| p.slug.clone()).unwrap_or_else(|| dep_project_id.clone()),
                        desc: dep_project.as_ref().and_then(|p| p.description.clone()).unwrap_or_default(),
                        icon: dep_project.as_ref().and_then(|p| p.icon_url.clone()).unwrap_or_default(),
                        source: dep_project.as_ref().and_then(|p| p.source_url.clone()).unwrap_or_default(),
                        license: dep_project.as_ref().and_then(|p| p.license.as_ref().and_then(|l| l.id.clone())).unwrap_or_default(),
                        version_id,
                        version_number,
                        mod_deps,
                    });
                }
            }
        }
    }

    // All async work is done; now do DB operations synchronously
    let conn = get_conn(&db)?;
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().timestamp_millis();
    conn.execute(
        "INSERT INTO projects (id, name, description, mc_version, loader, author, tags, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        rusqlite::params![id, name, description, mc_version, loader_str, "", "[]", now, now],
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    // Map from modrinth_id to local mod_id (for dependency edges)
    let mut mod_id_map: std::collections::HashMap<String, String> = std::collections::HashMap::new();

    for dep in &dep_infos {
        let mod_id = Uuid::new_v4().to_string();
        mod_id_map.insert(dep.project_id.clone(), mod_id.clone());
        let _ = conn.execute(
            "INSERT INTO project_mods (id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
            rusqlite::params![mod_id, id, dep.project_id, dep.slug, dep.name, dep.version_id, dep.version_number, dep.icon, dep.desc, "", dep.source, dep.license, now],
        );
    }

    // Save dependency edges for each mod
    for dep in &dep_infos {
        if let Some(mod_id) = mod_id_map.get(&dep.project_id) {
            for (dep_slug, dep_type, dep_modrinth_id) in &dep.mod_deps {
                let dep_id = Uuid::new_v4().to_string();
                let _ = conn.execute(
                    "INSERT INTO dependencies (id, project_mod_id, depends_on_slug, dep_type, dep_modrinth_id) VALUES (?1, ?2, ?3, ?4, ?5)",
                    rusqlite::params![dep_id, mod_id, dep_slug, dep_type, dep_modrinth_id],
                );
            }
        }
    }

    Ok(Project {
        id,
        name,
        description,
        mc_version,
        loader: loader_str.to_string(),
        author: String::new(),
        tags: "[]".to_string(),
        created_at: now,
        updated_at: now,
    })
}
