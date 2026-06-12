use crate::commands::mods::ProjectMod;
use std::fs;
use std::io::Write;
use std::path::Path;

pub fn export_prism_pack(
    name: &str,
    mc_version: &str,
    loader: &str,
    _mods: &[ProjectMod],
    output_path: &str,
) -> Result<String, String> {
    let dir = Path::new(output_path);
    fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(dir.join(".minecraft")).map_err(|e| e.to_string())?;
    fs::create_dir_all(dir.join(".minecraft/mods")).map_err(|e| e.to_string())?;

    let uid = match loader {
        "forge" => "net.minecraftforge",
        "neoforge" => "net.neoforged",
        "fabric" => "net.fabricmc.fabric-loader",
        "quilt" => "org.quiltmc.quilt-loader",
        _ => loader,
    };

    let mmc_pack = format!(r#"{{
  "components": [
    {{"uid": "net.minecraft","version": "{mc_version}"}},
    {{"uid": "{uid}","version": "0"}}
  ],
  "formatVersion": 1
}}"#, mc_version = mc_version, uid = uid);

    let mut file = fs::File::create(dir.join("mmc-pack.json")).map_err(|e| e.to_string())?;
    file.write_all(mmc_pack.as_bytes()).map_err(|e| e.to_string())?;

    let cfg = format!("InstanceType=OneSix\nname={}\n", name);
    let mut file = fs::File::create(dir.join("instance.cfg")).map_err(|e| e.to_string())?;
    file.write_all(cfg.as_bytes()).map_err(|e| e.to_string())?;

    Ok(dir.to_string_lossy().to_string())
}
