import type { DatabaseConnection, Driver } from 'kysely'
import { BaseDialect } from '../baseDialect'
import { TaruiSqlDriver } from './driver'
import type { TauriSqlDB } from './type'

export interface TauriSqlDialectConfig {
  /**
   * The path is relative to `tauri::api::path::BaseDirectory::App`.
   */
  database: TauriSqlDB | (() => Promise<TauriSqlDB>)
  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>
}
/**
 * https://github.com/tauri-apps/plugins-workspace/tree/dev/plugins/sql
 */
export class TauriSqlDialect extends BaseDialect {
  #config: TauriSqlDialectConfig
  /**
   * currently no support for bigint
   */
  constructor(config: TauriSqlDialectConfig) {
    super()
    this.#config = config
  }

  createDriver(): Driver {
    return new TaruiSqlDriver(this.#config)
  }
}
