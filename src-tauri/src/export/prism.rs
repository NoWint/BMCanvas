use crate::commands::mods::ProjectMod;
use serde_json::json;
use std::fs;
use std::path::Path;

pub fn export_prism_pack(
    project_name: &str,
    mc_version: &str,
    loader: &str,
    _mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let instance_dir = Path::new(output_path).join(project_name);
    let mods_dir = instance_dir.join("mods");
    fs::create_dir_all(&mods_dir).map_err(|e: std::io::Error| e.to_string())?;

    let mmc_pack = json!({
        "components": [
            { "uid": "net.minecraft", "version": mc_version },
            { "uid": format!("net.{}", loader), "version": "0" }
        ]
    });
    fs::write(
        instance_dir.join("mmc-pack.json"),
        serde_json::to_string_pretty(&mmc_pack).map_err(|e: serde_json::Error| e.to_string())?,
    ).map_err(|e: std::io::Error| e.to_string())?;

    let cfg = format!("name={}\nInstanceType=OneSix\n", project_name);
    fs::write(instance_dir.join("instance.cfg"), cfg).map_err(|e: std::io::Error| e.to_string())?;

    Ok(instance_dir.to_string_lossy().to_string())
}
