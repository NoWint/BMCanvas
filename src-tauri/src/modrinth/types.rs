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
