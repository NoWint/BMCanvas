use crate::commands::mods::ProjectMod;
use std::fs;
use std::io::Write;
use std::path::Path;

pub fn export_zip_pack(
    name: &str,
    mc_version: &str,
    loader: &str,
    mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let dir = Path::new(output_path);
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(dir.join("mods")).map_err(|e| e.to_string())?;

    let readme = format!(
        "# {}\n\nMinecraft {} with {}\n\n## Mods ({} total)\n\n{}",
        name,
        mc_version,
        loader,
        mods.len(),
        mods.iter().map(|m| format!("- {} ({})", m.name, m.version_number.as_deref().unwrap_or("?"))).collect::<Vec<_>>().join("\n")
    );

    let mut file = fs::File::create(dir.join("README.md")).map_err(|e| e.to_string())?;
    file.write_all(readme.as_bytes()).map_err(|e| e.to_string())?;

    let mod_list: Vec<serde_json::Value> = mods.iter().map(|m| serde_json::json!({
        "name": m.name,
        "slug": m.slug,
        "version": m.version_number
    })).collect();

    let manifest = format!(r#"{{
  "name": "{name}",
  "mc_version": "{mc_version}",
  "loader": "{loader}",
  "mods": {mod_list}
}}"#,
        name = name,
        mc_version = mc_version,
        loader = loader,
        mod_list = serde_json::to_string(&mod_list).unwrap_or_default()
    );

    let mut file = fs::File::create(dir.join("manifest.json")).map_err(|e| e.to_string())?;
    file.write_all(manifest.as_bytes()).map_err(|e| e.to_string())?;

    Ok(dir.to_string_lossy().to_string())
}
