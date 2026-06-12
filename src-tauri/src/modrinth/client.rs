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
            .map_err(|e: reqwest::Error| e.to_string())?;

        resp.json::<SearchResponse>().await.map_err(|e: reqwest::Error| e.to_string())
    }

    pub async fn get_project(&self, id: &str) -> Result<ModrinthProject, String> {
        let resp = self.client
            .get(format!("{}/project/{}", MODRINTH_API_BASE, id))
            .send()
            .await
            .map_err(|e: reqwest::Error| e.to_string())?;

        resp.json::<ModrinthProject>().await.map_err(|e: reqwest::Error| e.to_string())
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
            .map_err(|e: reqwest::Error| e.to_string())?;

        resp.json::<Vec<ModrinthVersion>>().await.map_err(|e: reqwest::Error| e.to_string())
    }

    pub async fn search_modpacks(
        &self,
        query: &str,
        game_versions: Option<Vec<String>>,
        limit: Option<u32>,
        offset: Option<u32>,
    ) -> Result<SearchResponse, String> {
        let mut params: Vec<(&str, String)> = vec![("query", query.to_string())];

        let mut facets: Vec<Vec<String>> = vec![vec!["project_type:modpack".to_string()]];
        if let Some(versions) = game_versions {
            let version_facets: Vec<String> = versions.iter().map(|v| format!("versions:{}", v)).collect();
            facets.push(version_facets);
        }
        params.push(("facets", serde_json::to_string(&facets).unwrap_or_default()));

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
            .map_err(|e: reqwest::Error| e.to_string())?;

        resp.json::<SearchResponse>().await.map_err(|e: reqwest::Error| e.to_string())
    }
}
