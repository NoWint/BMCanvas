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
