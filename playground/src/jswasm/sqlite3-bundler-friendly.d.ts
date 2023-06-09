import type { OfficialSqliteWasmDB } from 'kysely-wasm/dist/cjs/official-sqlite-wasm-dialect/type'

export type OO = {
  OpfsDb: new (path: string) => OfficialSqliteWasmDB
  DB: new (path: string) => OfficialSqliteWasmDB
}
export default function sqlite3InitModule(): Promise<{ oo1: OO }>
