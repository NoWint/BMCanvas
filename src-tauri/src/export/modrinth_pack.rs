use crate::commands::mods::ProjectMod;
use std::fs;
use std::io::Write;
use std::path::Path;

pub fn export_modrinth_pack(
    name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let dir = Path::new(output_path);
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;

    let loader_id = match loader {
        "forge" => "forge",
        "neoforge" => "neoforge",
        "fabric" => "fabric-loader",
        "quilt" => "quilt-loader",
        _ => loader,
    };

    let mut files_json = Vec::new();
    for m in mods {
        let fallback_slug = m.name.to_lowercase().replace(' ', "-");
        let slug = m.slug.as_deref().unwrap_or(&fallback_slug);
        files_json.push(format!(
            r#"{{"path": "mods/{}.jar","hashes":{{}},"downloads":[],"fileSize":0}}"#,
            slug
        ));
    }

    let index = format!(r#"{{
  "formatVersion": 1,
  "game": "minecraft",
  "versionId": "{name}-{mc_version}",
  "name": "{name}",
  "files": [{files}],
  "dependencies": {{
    "minecraft": "{mc_version}",
    "{loader_id}": "0"
  }}
}}"#,
        name = name,
        mc_version = mc_version,
        loader_id = loader_id,
        files = files_json.join(",\n    ")
    );

    let index_path = dir.join("modrinth.index.json");
    let mut file = fs::File::create(&index_path).map_err(|e| e.to_string())?;
    file.write_all(index.as_bytes()).map_err(|e| e.to_string())?;

    fs::create_dir_all(dir.join("overrides")).map_err(|e| e.to_string())?;

    Ok(index_path.to_string_lossy().to_string())
}
