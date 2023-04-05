import * as SQLite from 'wa-sqlite'
import SQLiteAsyncModule from 'wa-sqlite/dist/wa-sqlite-async.mjs'

import { IDBBatchAtomicVFS } from './IDBBatchAtomicVFS'

export async function testWaSqlite(wasmUrl: string, dbName: string, sql: string, params: any[]) {
  const module = await SQLiteAsyncModule({ locateFile: () => wasmUrl })

  const sqlite3 = SQLite.Factory(module)

  sqlite3.vfs_register(
    new IDBBatchAtomicVFS('wa-sqlite-db-atomic-batched', {
      purge: 'manual',
      durability: 'relaxed',
      purgeAtLeast: 1024,
    }),
  )

  const db = await sqlite3.open_v2(
    dbName,
    undefined,
    'wa-sqlite-db-atomic-batched',
  )

  await sqlite3.exec(
    db, `PRAGMA cache_size=5000;PRAGMA page_size=${32 * 1024};PRAGMA journal_mode=DELETE;`,
  )
  const rows = []

  const str = sqlite3.str_new(db, sql)
  const prepare = await sqlite3.prepare_v2(db, sqlite3.str_value(str))

  if (!prepare) {
    throw new Error(`Failed to prepare ${sql} query`)
  }

  sqlite3.bind_collection(
    prepare.stmt,
    params as SQLiteCompatibleType[],
  )

  const columns = sqlite3.column_names(prepare.stmt)

  while ((await sqlite3.step(prepare.stmt)) === SQLite.SQLITE_ROW) {
    if (columns.length > 0) {
      rows.push(
        Object.fromEntries(
          sqlite3
            .row(prepare.stmt)
            .map((val, i) => [columns[i], val]),
        ),
      )
    }
  }
  sqlite3.str_finish(str)
  await sqlite3.finalize(prepare.stmt)
  return rows
}
