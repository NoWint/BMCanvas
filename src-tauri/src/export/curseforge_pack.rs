use crate::commands::mods::ProjectMod;
use std::fs;
use std::io::Write;
use std::path::Path;

pub fn export_curseforge_pack(
    name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let dir = Path::new(output_path);
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;

    let mut files_json = Vec::new();
    for _m in mods {
        files_json.push(r#"{{"projectID": 0,"fileID": 0,"required": true}}"#.to_string());
    }

    let manifest = format!(r#"{{
  "minecraft": {{
    "version": "{mc_version}",
    "modLoaders": [{{"id": "{loader}", "primary": true}}]
  }},
  "manifestType": "minecraftModpack",
  "manifestVersion": 1,
  "name": "{name}",
  "files": [{files}],
  "overrides": "overrides"
}}"#,
        name = name,
        mc_version = mc_version,
        loader = loader,
        files = files_json.join(",\n    ")
    );

    let manifest_path = dir.join("manifest.json");
    let mut file = fs::File::create(&manifest_path).map_err(|e| e.to_string())?;
    file.write_all(manifest.as_bytes()).map_err(|e| e.to_string())?;

    fs::create_dir_all(dir.join("overrides")).map_err(|e| e.to_string())?;

    Ok(manifest_path.to_string_lossy().to_string())
}
