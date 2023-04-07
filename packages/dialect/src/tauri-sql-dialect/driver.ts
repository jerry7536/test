import { BaseDriver, BaseSqliteConnection } from '../baseDriver'
import type { TauriSqlDB } from './type'
import type { TauriSqlDialectConfig } from '.'

export class OfficialSqliteWasmDriver extends BaseDriver {
  #config: TauriSqlDialectConfig
  #db?: TauriSqlDB
  constructor(config: TauriSqlDialectConfig) {
    super()
    this.#config = config
  }

  async init(): Promise<void> {
    this.#db = typeof this.#config.database === 'function'
      ? await this.#config.database()
      : this.#config.database
    this.connection = new TauriSqlConnection(this.#db)
    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.connection)
    }
  }
}
class TauriSqlConnection extends BaseSqliteConnection {
  #db: TauriSqlDB
  constructor(db: any) {
    super()
    this.#db = db
  }

  async query(sql: string, param?: any[]) {
    return await this.#db.select(sql, param ?? []) as any[]
  }

  async exec(sql: string, param?: any[]) {
    const { lastInsertId, rowsAffected } = await this.#db.execute(sql, param ?? [])
    return {
      numAffectedRows: BigInt(rowsAffected),
      insertId: lastInsertId,
    }
  }
}
