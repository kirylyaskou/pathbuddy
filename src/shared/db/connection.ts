import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null

export async function getDb(): Promise<Database> {
  if (!db) {
    // 10-second timeout guards against indefinite hang when WAL files from a
    // previous dev/prod session are locking the database (SQLite has no
    // default busy_timeout — it waits forever without this guard).
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('DB timed out. Delete AppData/Roaming/com.pathmaid.app/*.db* and restart.')),
        10_000,
      )
    )
    db = await Promise.race([Database.load('sqlite:pathmaid.db'), timeout])
  }
  return db
}
