import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { pool } from './pool.js';

const here = path.dirname(fileURLToPath(import.meta.url));

export async function runMigrations(database = pool) {
  await database.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    name TEXT PRIMARY KEY,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`);
  const files = (await fs.readdir(path.join(here, 'migrations')))
    .filter(name => /^\d+_[a-z0-9_]+\.sql$/i.test(name))
    .sort();
  for (const name of files) {
    const client = await database.connect();
    try {
      const { rowCount } = await client.query('SELECT 1 FROM schema_migrations WHERE name=$1', [name]);
      if (rowCount) continue;
      const sql = await fs.readFile(path.join(here, 'migrations', name), 'utf8');
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name) VALUES($1)', [name]);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw new Error(`Migration ${name} failed: ${error.message}`, { cause: error });
      }
    } catch (error) {
      throw error;
    } finally { client.release(); }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  try {
    await runMigrations();
    console.log('Database migrations are up to date.');
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
