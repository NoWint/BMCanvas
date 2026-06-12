mod commands;
mod db;

use db::DbState;
use std::sync::Mutex;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir()
                .expect("Failed to resolve app data dir")
                .to_string_lossy()
                .to_string();

            std::fs::create_dir_all(&app_data_dir).ok();

            let conn = db::init_db(&app_data_dir)
                .expect("Failed to initialize database");

            app.manage(Mutex::new(conn));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::project::create_project,
            commands::project::list_projects,
            commands::project::get_project,
            commands::project::delete_project,
            commands::mods::add_mod_to_project,
            commands::mods::remove_mod_from_project,
            commands::mods::list_project_mods,
            commands::mods::save_dependencies,
            commands::mods::get_dependencies,
            commands::mods::get_all_dependencies,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
