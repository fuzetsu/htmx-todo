import Database from 'bun:sqlite'
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { migrate } from 'drizzle-orm/bun-sqlite/migrator'

// create dun sqlite db
const sqlite = new Database('data.db', { create: true })
sqlite.exec('PRAGMA journal_mode = WAL;')

// wrap with drizzle
const db = drizzle(sqlite, { logger: true })

// run migrations
migrate(db, { migrationsFolder: './migrations' })

export { db }
