pub mod migrations;

use rusqlite::Connection;
use std::sync::Mutex;
use tauri::State;

pub type DbState = Mutex<Connection>;

pub fn init_db(app_data_dir: &str) -> Result<Connection, String> {
    let db_path = format!("{}/modcanvas.db", app_data_dir);
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")
        .map_err(|e| e.to_string())?;
    migrations::run(&conn)?;
    Ok(conn)
}

pub fn get_conn(db: &State<DbState>) -> Result<std::sync::MutexGuard<Connection>, String> {
    db.lock().map_err(|e| e.to_string())
}
