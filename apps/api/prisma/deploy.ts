import 'dotenv/config';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

/**
 * Applies pending Prisma migrations over Neon's serverless driver (port 443).
 *
 * Why this exists: `prisma migrate deploy` connects via raw TCP on port 5432,
 * which is blocked on the dev network. This script reproduces what `migrate deploy`
 * does — run each migration's SQL and record it in `_prisma_migrations` with the
 * same checksum format — so the production `prisma migrate deploy` on Render (where
 * 5432 works) sees the migrations as already applied and is a no-op. Both target the
 * same Neon database, so the schema is set up exactly once.
 */
neonConfig.webSocketConstructor = ws;

const MIGRATIONS_DIR = join(__dirname, 'migrations');

/** Prisma records a SHA-256 hex digest of each migration.sql as its checksum. */
function checksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex');
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is not set');

  const pool = new Pool({ connectionString: databaseUrl });

  // The migrations bookkeeping table, matching Prisma's own definition.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" VARCHAR(36) PRIMARY KEY NOT NULL,
      "checksum" VARCHAR(64) NOT NULL,
      "finished_at" TIMESTAMPTZ,
      "migration_name" VARCHAR(255) NOT NULL,
      "logs" TEXT,
      "rolled_back_at" TIMESTAMPTZ,
      "started_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    );
  `);

  const migrationDirs = readdirSync(MIGRATIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  for (const name of migrationDirs) {
    const sqlPath = join(MIGRATIONS_DIR, name, 'migration.sql');
    if (!existsSync(sqlPath)) continue;

    const already = await pool.query(
      'SELECT 1 FROM "_prisma_migrations" WHERE migration_name = $1 AND finished_at IS NOT NULL',
      [name],
    );
    if (already.rowCount && already.rowCount > 0) {
      // eslint-disable-next-line no-console
      console.log(`✓ ${name} already applied`);
      continue;
    }

    const sql = readFileSync(sqlPath, 'utf8');
    // eslint-disable-next-line no-console
    console.log(`→ applying ${name}`);
    // The simple-query protocol runs all statements in the file in one round trip.
    await pool.query(sql);

    await pool.query(
      `INSERT INTO "_prisma_migrations"
         (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
       VALUES ($1, $2, $3, now(), now(), 1)`,
      [randomUUID(), checksum(sql), name],
    );
    // eslint-disable-next-line no-console
    console.log(`✓ applied ${name}`);
  }

  await pool.end();
  // eslint-disable-next-line no-console
  console.log('\n✅ Migrations up to date.');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Migration failed:', err);
  process.exit(1);
});
