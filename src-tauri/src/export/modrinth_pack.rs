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
    fs::create_dir_all(&mods_dir).map_err(|e: std::io::Error| e.to_string())?;

    let files_json: Vec<serde_json::Value> = mods.iter().filter_map(|m| {
        m.modrinth_id.as_ref().map(|_mid| {
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
    let index_content = serde_json::to_string_pretty(&index).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(&index_path, index_content).map_err(|e: std::io::Error| e.to_string())?;

    Ok(output_dir.to_string_lossy().to_string())
}
