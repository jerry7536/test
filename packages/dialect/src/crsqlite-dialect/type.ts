import type { BaseDB } from '../baseDriver'

export interface CrSqliteDB extends BaseDB {
  exec(sql: string, bind?: unknown[]): void
  execO<T = any>(sql: string, bind?: unknown[]): T[]
  onUpdate(cb: (
    type: any,
    dbName: string,
    tblName: string,
    rowid: bigint
  ) => void): void
  api: {
    change(db: number): bigint
  }
  db: number
}
