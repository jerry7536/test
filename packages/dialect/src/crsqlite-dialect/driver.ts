import { BaseDriver, BaseSqliteConnection } from '../baseDriver'
import type { CrSqliteDB } from './type'
import type { CrSqliteDialectConfig } from '.'

export class CrSqliteDriver extends BaseDriver {
  #config: CrSqliteDialectConfig
  #db?: CrSqliteDB
  constructor(config: CrSqliteDialectConfig) {
    super()
    this.#config = config
  }

  async init(): Promise<void> {
    this.#db = typeof this.#config.database === 'function'
      ? await this.#config.database()
      : this.#config.database
    this.connection = new OfficailSqliteWasmConnection(this.#db)
    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.connection)
    }
  }
}
class OfficailSqliteWasmConnection extends BaseSqliteConnection {
  #db: CrSqliteDB
  constructor(db: any) {
    super()
    this.#db = db
  }

  async query(sql: string, param?: any[]): Promise<any[]> {
    return this.#db.execO(sql, param ?? [])
  }

  async exec(sql: string, param?: any[]) {
    this.#db.exec(sql, param ?? [])
    const insertId = await new Promise((resolve) => {
      this.#db.onUpdate((_, __, ___, id) => resolve(id))
    })
    return {
      numAffectedRows: this.#db.api.change(this.#db.db),
      insertId,
    }
  }
}
