use rusqlite::Connection;

pub fn run(conn: &Connection) -> Result<(), String> {
    // Create schema_version table
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY);"
    ).map_err(|e| e.to_string())?;

    // Get current version
    let current_version: i32 = conn.query_row(
        "SELECT COALESCE(MAX(version), 0) FROM schema_version",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    // V1: Initial schema (only run if fresh database)
    if current_version < 1 {
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS projects (
                id          TEXT PRIMARY KEY,
                name        TEXT NOT NULL,
                description TEXT DEFAULT '',
                mc_version  TEXT NOT NULL,
                loader      TEXT NOT NULL,
                author      TEXT DEFAULT '',
                tags        TEXT DEFAULT '[]',
                created_at  INTEGER NOT NULL,
                updated_at  INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS project_mods (
                id              TEXT PRIMARY KEY,
                project_id      TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
                modrinth_id     TEXT,
                slug            TEXT,
                name            TEXT NOT NULL,
                version_id      TEXT,
                version_number  TEXT,
                icon_url        TEXT,
                description     TEXT,
                author          TEXT,
                source_url      TEXT,
                license         TEXT,
                added_at        INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS dependencies (
                id              TEXT PRIMARY KEY,
                project_mod_id  TEXT NOT NULL REFERENCES project_mods(id) ON DELETE CASCADE,
                depends_on_slug TEXT NOT NULL,
                dep_type        TEXT NOT NULL,
                dep_modrinth_id TEXT
            );

            CREATE TABLE IF NOT EXISTS mod_cache (
                modrinth_id  TEXT PRIMARY KEY,
                slug         TEXT,
                name         TEXT,
                description  TEXT,
                icon_url     TEXT,
                author       TEXT,
                downloads    INTEGER,
                categories   TEXT DEFAULT '[]',
                loaders      TEXT DEFAULT '[]',
                versions     TEXT DEFAULT '[]',
                cached_at    INTEGER NOT NULL
            );"
        ).map_err(|e| e.to_string())?;

        conn.execute("INSERT INTO schema_version (version) VALUES (1)", []).map_err(|e| e.to_string())?;
    }

    // V2: Add homepage_url and changelog columns
    if current_version < 2 {
        conn.execute_batch(
            "ALTER TABLE project_mods ADD COLUMN homepage_url TEXT DEFAULT '';
             ALTER TABLE project_mods ADD COLUMN changelog TEXT DEFAULT '';"
        ).map_err(|e| e.to_string())?;

        conn.execute("INSERT INTO schema_version (version) VALUES (2)", []).map_err(|e| e.to_string())?;
    }

    // V3: Add supported_mc_versions column
    if current_version < 3 {
        conn.execute_batch(
            "ALTER TABLE project_mods ADD COLUMN supported_mc_versions TEXT DEFAULT '[]';"
        ).map_err(|e| e.to_string())?;

        conn.execute("INSERT INTO schema_version (version) VALUES (3)", []).map_err(|e| e.to_string())?;
    }

    Ok(())
}
