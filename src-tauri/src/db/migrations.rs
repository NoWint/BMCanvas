use rusqlite::Connection;

pub fn run(conn: &Connection) -> Result<(), String> {
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
    ).map_err(|e| e.to_string())
}
