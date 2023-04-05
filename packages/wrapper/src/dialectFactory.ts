import type { Dialect } from 'kysely'
import { SqliteDialect } from 'kysely'
import Databse from 'better-sqlite3'
import { OfficialSqliteWasmDialect, SqlJsDialect, optimzePragma } from 'kysely-wasm'
import type { DialectOption } from './types'

export function getDialect(config: DialectOption | Dialect) {
  if (!('lib' in config)) {
    return config
  }
  switch (config.lib) {
    case 'better-sqlite3':
      return new SqliteDialect({
        database: new Databse(config.path),
        onCreateConnection: config.onCreateConnection,
      })
    case 'sql.js':
      return new SqlJsDialect({
        database: () => getSqljsDB(config.buffer),
        onWrite: config.onWrite,
        onCreateConnection: async (conn) => {
          optimzePragma(conn)
          config.onCreateConnection && config.onCreateConnection(conn)
        },
      })
    case 'official-wasm':
      return new OfficialSqliteWasmDialect({
        database: () => getOfficialWasmDB(config.path),
        onCreateConnection: async (conn) => {
          optimzePragma(conn)
          config.onCreateConnection && config.onCreateConnection(conn)
        },
      })
  }
}
async function getSqljsDB(buffer?: Uint8Array) {
  const initSqlJs = await import('sql.js')
  const SQL = await initSqlJs.default({
    // locateFile: () => new URL('../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).href,
  })
  return new SQL.Database(buffer)
}
async function getOfficialWasmDB(path: string) {
  const { sqlite3InitModule } = await import('./jswasm/sqlite3-bundler-friendly')
  const sqlite3 = (await sqlite3InitModule()).oo1
  if (!sqlite3) {
    return Promise.reject('fail to load sqlite')
  }
  if (sqlite3.OpfsDb) {
    console.log('support OPFS')
    return new sqlite3.OpfsDb(path)
  }
  console.log('doesn\'t support OPFS')
  return new sqlite3.DB(path)
}
