use crate::db::{get_conn, DbState};
use crate::commands::mods::ProjectMod;
use crate::export;
use serde::Deserialize;
use tauri::State;

#[derive(Debug, Deserialize)]
pub enum ExportFormat {
    Modrinth,
    Curseforge,
    Prism,
    Zip,
}

#[derive(Debug, Deserialize)]
pub struct ExportInput {
    pub project_id: String,
    pub format: ExportFormat,
    pub output_path: String,
}

#[tauri::command]
pub fn export_pack(input: ExportInput, db: State<DbState>) -> Result<String, String> {
    let conn = get_conn(&db)?;

    let (name, mc_version, loader): (String, String, String) = conn
        .query_row(
            "SELECT name, mc_version, loader FROM projects WHERE id = ?1",
            rusqlite::params![input.project_id],
            |row: &rusqlite::Row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e: rusqlite::Error| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, project_id, modrinth_id, slug, name, version_id, version_number, icon_url, description, author, source_url, license, added_at, homepage_url, changelog, supported_mc_versions FROM project_mods WHERE project_id = ?1"
    ).map_err(|e: rusqlite::Error| e.to_string())?;

    let mods: Vec<ProjectMod> = stmt.query_map(rusqlite::params![input.project_id], |row: &rusqlite::Row| {
        let homepage_url: Option<String> = row.get(13)?;
        let changelog: Option<String> = row.get(14)?;
        let supported_mc_versions_str: String = row.get(15).unwrap_or_default();
        let supported_mc_versions: Vec<String> = serde_json::from_str(&supported_mc_versions_str).unwrap_or_default();
        Ok(ProjectMod {
            id: row.get(0)?,
            project_id: row.get(1)?,
            modrinth_id: row.get(2)?,
            slug: row.get(3)?,
            name: row.get(4)?,
            version_id: row.get(5)?,
            version_number: row.get(6)?,
            icon_url: row.get(7)?,
            description: row.get(8)?,
            author: row.get(9)?,
            source_url: row.get(10)?,
            license: row.get(11)?,
            added_at: row.get(12)?,
            homepage_url,
            supported_mc_versions: Some(supported_mc_versions),
            changelog,
        })
    }).map_err(|e: rusqlite::Error| e.to_string())?
    .collect::<Result<Vec<_>, _>>().map_err(|e: rusqlite::Error| e.to_string())?;

    match input.format {
        ExportFormat::Modrinth => {
            export::modrinth_pack::export_modrinth_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Curseforge => {
            export::curseforge_pack::export_curseforge_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Prism => {
            export::prism::export_prism_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
        ExportFormat::Zip => {
            export::zip_export::export_zip_pack(&name, &mc_version, &loader, &mods, &input.output_path)
        }
    }
}
