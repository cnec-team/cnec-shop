/**
 * Pre-deploy script: automatically resolves failed Prisma migrations.
 *
 * When a Prisma migration fails partway through, Prisma marks it as failed in
 * the _prisma_migrations table and refuses to retry it (error P3009). This
 * script detects such failed migrations and deletes them so `prisma migrate
 * deploy` can re-apply them with the corrected (idempotent) SQL.
 *
 * Safe to run on a fresh DB — it skips gracefully if _prisma_migrations
 * doesn't exist yet.
 */
import { Client } from 'pg'

async function main() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    console.log('[resolve-failed-migrations] DATABASE_URL not set, skipping.')
    return
  }

  const client = new Client({ connectionString: databaseUrl })

  try {
    await client.connect()
  } catch (err) {
    console.log('[resolve-failed-migrations] Could not connect, skipping:', err instanceof Error ? err.message : err)
    return
  }

  try {
    const tableCheck = await client.query(
      `SELECT to_regclass('public._prisma_migrations') AS exists`
    )
    if (!tableCheck.rows[0]?.exists) {
      console.log('[resolve-failed-migrations] _prisma_migrations does not exist yet, skipping.')
      return
    }

    const failed = await client.query(
      `SELECT migration_name FROM _prisma_migrations
       WHERE finished_at IS NULL AND rolled_back_at IS NULL`
    )

    if (failed.rowCount === 0) {
      console.log('[resolve-failed-migrations] No failed migrations found.')
      return
    }

    for (const row of failed.rows) {
      console.log(`[resolve-failed-migrations] Removing failed migration record: ${row.migration_name}`)
      await client.query(
        `DELETE FROM _prisma_migrations WHERE migration_name = $1 AND finished_at IS NULL`,
        [row.migration_name]
      )
    }

    console.log('[resolve-failed-migrations] Done. Prisma will re-apply these migrations.')
  } catch (err) {
    console.error('[resolve-failed-migrations] Error:', err)
    // Don't fail the build — let prisma migrate deploy report the real issue.
  } finally {
    await client.end().catch(() => {})
  }
}

main().catch(err => {
  console.error('[resolve-failed-migrations] Unexpected error:', err)
  // Don't fail the build
})
