import type { DatabaseConnection } from 'kysely'
import { CompiledQuery } from 'kysely'

/**
 * execute pragma to the sqlite connection for wasm.
 * @param conn The database connection.
 * @param cacheSize The cache size, @default 4096
 * @param pageSize The page size, @default 32 * 1024
 * @returns Promise<void>
 *
 * @example
 * ```ts
 * await optimzePragma(conn);
 * ```
 */
export async function optimzePragma(conn: DatabaseConnection, cacheSize = 4096, pageSize = 32 * 1024): Promise<void> {
  await conn.executeQuery(CompiledQuery.raw(
    `PRAGMA cache_size=${cacheSize};
     PRAGMA journal_mode=MEMORY;
     PRAGMA locking_mode = MEMORY;
     PRAGMA temp_store = 2;
     PRAGMA page_size=${pageSize};`,
  ))
}
