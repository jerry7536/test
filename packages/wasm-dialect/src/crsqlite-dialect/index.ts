import type { DatabaseConnection, Driver } from 'kysely'
import { BaseDialect } from '../baseDialect'
import { CrSqliteDriver } from './driver'
import type { CrSqliteDB } from './type'

export interface CrSqliteDialectConfig {
  database: CrSqliteDB | (() => Promise<CrSqliteDB>)
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
export class CrSqliteDialect extends BaseDialect {
  #config: CrSqliteDialectConfig
  /**
   * {@link https://vlcn.io/js/wasm vlcn.io wasm}, using indexeddb db as backend
   */
  constructor(config: CrSqliteDialectConfig) {
    super()
    this.#config = config
  }

  createDriver(): Driver {
    return new CrSqliteDriver(this.#config)
  }
}
