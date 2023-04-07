import type { DatabaseConnection, Driver } from 'kysely'
import { BaseDialect } from '../baseDialect'
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
  createDriver(): Driver {
    throw new Error('Method not implemented.')
  }
}
