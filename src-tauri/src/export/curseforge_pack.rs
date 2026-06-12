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
    fs::create_dir_all(&mods_dir).map_err(|e: std::io::Error| e.to_string())?;

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
    let content = serde_json::to_string_pretty(&manifest).map_err(|e: serde_json::Error| e.to_string())?;
    fs::write(&manifest_path, content).map_err(|e: std::io::Error| e.to_string())?;

    let modlist = format!(
        "<ul>{}</ul>",
        mods.iter()
            .map(|m| format!("<li>{}</li>", m.name))
            .collect::<Vec<_>>()
            .join("")
    );
    fs::write(temp_dir.join("modlist.html"), modlist).map_err(|e: std::io::Error| e.to_string())?;

    Ok(temp_dir.to_string_lossy().to_string())
}
