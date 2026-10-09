// D1 access. The schema is created on first use so a fresh database needs no manual migration.

let schemaReady = null;

export function ensureSchema(db) {
  if (!schemaReady) {
    schemaReady = db
      .batch([
        db.prepare(`CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL DEFAULT '',
          role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
          password_hash TEXT NOT NULL,
          must_change_password INTEGER NOT NULL DEFAULT 0,
          disabled INTEGER NOT NULL DEFAULT 0,
          created_at INTEGER NOT NULL,
          last_login_at INTEGER
        )`),
        db.prepare(`CREATE TABLE IF NOT EXISTS sessions (
          token_hash TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          created_at INTEGER NOT NULL,
          expires_at INTEGER NOT NULL
        )`),
        db.prepare('CREATE INDEX IF NOT EXISTS sessions_user_idx ON sessions(user_id)'),
        db.prepare(`CREATE TABLE IF NOT EXISTS login_attempts (
          key TEXT PRIMARY KEY,
          count INTEGER NOT NULL,
          window_start INTEGER NOT NULL
        )`),
      ])
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

export function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    mustChangePassword: !!row.must_change_password,
    disabled: !!row.disabled,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at,
  };
}
