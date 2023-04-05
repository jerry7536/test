import type { DatabaseConnection, Driver } from 'kysely'
import { BaseDialect } from '../baseDialect'
import { SqlJsDriver } from './driver'
import type { SqlJSDB } from './type'

export interface SqlJsDialectConfig {
  database: SqlJSDB | (() => Promise<SqlJSDB>)
  onWrite?: (buffer: Uint8Array) => void
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
export class SqlJsDialect extends BaseDialect {
  readonly #config: SqlJsDialectConfig

  /**
   * currently no support for bigint
   */
  constructor(config: SqlJsDialectConfig) {
    super()
    this.#config = config
  }

  createDriver(): Driver {
    return new SqlJsDriver(this.#config)
  }
}
