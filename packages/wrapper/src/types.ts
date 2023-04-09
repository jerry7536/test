import type { DatabaseConnection, Dialect, KyselyPlugin } from 'kysely'
import type { CompiledQuery } from 'kysely/dist/cjs/query-compiler/compiled-query'

export type DialectOption = ({
  lib: 'better-sqlite3'
  /**
   * to store data in memory, use ':memory:'
   * @see {@link https://github.com/WiseLibs/better-sqlite3/blob/master/docs/api.md#new-databasepath-options document}
   */
  path: string
} | {
  lib: 'official-wasm'
  path: string
} | {
  lib: 'sql.js'
  buffer?: Uint8Array
  onWrite?: {
    func: (buffer: Uint8Array) => void
    isThrottle?: boolean
    delay?: number
    maxCalls?: number
  }
}) & {
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
export type TriggerEvent = 'insert' | 'update' | 'delete'
export type column =
  | 'string'
  | 'boolean'
  | 'object'
  | 'number'
  | 'date'
  | 'increments'
  | 'blob'

export type ColumeOption<T> = {
  type: column
  defaultTo?: T
  notNull?: boolean
}
export type TableOption<T> = {
  primary?: keyof T | Array<keyof T>
  unique?: Array<keyof T | Array<keyof T>>
  index?: Array<keyof T | Array<keyof T>>
  timestamp?: boolean | { create?: keyof T; update?: keyof T }
}
export type Column<T> = {
  [k in keyof T]: ColumeOption<T[k]>
}
export type ITable<T> = {
  column: Column<Required<T>>
  property?: TableOption<T>
}
export type Tables<T> = {
  [Key in keyof T]: ITable<T[Key]>
}
export enum DBStatus {
  'needDrop',
  'noNeedDrop',
  'ready',
}
export type SqliteDBOption<T> = {
  tables: Tables<T>
  dialect: DialectOption | Dialect
  dropTableBeforeInit?: boolean
  queryLogger?: (queryInfo: CompiledQuery, time: number) => any
  errorLogger?: (reason: unknown) => any
  plugins?: Array<KyselyPlugin>
}
