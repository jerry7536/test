import type { DatabaseConnection, DatabaseIntrospector, Dialect, DialectAdapter, Driver, Kysely, QueryCompiler } from 'kysely'
import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from 'kysely'
import { SqlJsDriver } from './driver'
import type { SqlJSDB } from './type'

export interface SqlJsDialectConfig {
  database: SqlJSDB | (() => Promise<SqlJSDB>)
  onWrite?: (buffer: Uint8Array) => void
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
export class SqlJsDialect implements Dialect {
  readonly #config: SqlJsDialectConfig

  /**
   * currently no support for bigint
   */
  constructor(config: SqlJsDialectConfig) {
    this.#config = config
  }

  createDriver(): Driver {
    return new SqlJsDriver(this.#config)
  }

  createQueryCompiler(): QueryCompiler {
    return new SqliteQueryCompiler()
  }

  createAdapter(): DialectAdapter {
    return new SqliteAdapter()
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return new SqliteIntrospector(db)
  }
}
