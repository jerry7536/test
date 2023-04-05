import type { OfficialSqliteWasmDB } from 'kysely-wasm/dist/cjs/official-sqlite-wasm-dialect/type'

export type OO = {
  OpfsDb: new (path: string) => OfficialSqliteWasmDB
  DB: new (path: string) => OfficialSqliteWasmDB
}
export type capi = {
  sqlite3_js_db_export: (db:OfficialSqliteWasmDB) => Uint8Array
}
declare function sqlite3InitModule(): Promise<{ oo1: OO }>
export {
  sqlite3InitModule
}