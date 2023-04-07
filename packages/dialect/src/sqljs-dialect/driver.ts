import type { DatabaseConnection } from 'kysely'
import { CompiledQuery } from 'kysely'
import { BaseDriver, BaseSqliteConnection } from '../baseDriver'
import type { SqlJSDB } from './type'
import type { SqlJsDialectConfig } from '.'

export class SqlJsDriver extends BaseDriver {
  readonly #config: SqlJsDialectConfig
  declare connection?: SqlJsConnection | undefined

  #db?: SqlJSDB

  constructor(config: SqlJsDialectConfig) {
    super()
    this.#config = config
  }

  async init(): Promise<void> {
    this.#db = typeof this.#config.database === 'function'
      ? await this.#config.database()
      : this.#config.database

    if (!this.#db) {
      throw new Error('no database')
    }

    this.connection = new SqlJsConnection(this.#db, this.#config.onWrite)

    if (this.#config.onCreateConnection) {
      await this.#config.onCreateConnection(this.connection)
    }
  }

  async beginTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('begin'))
    this.connection && this.connection.transactionNum++
  }

  async commitTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('commit'))
    this.connection && this.connection.transactionNum--
  }

  async rollbackTransaction(connection: DatabaseConnection): Promise<void> {
    await connection.executeQuery(CompiledQuery.raw('rollback'))
    this.connection && this.connection.transactionNum--
  }
}
class SqlJsConnection extends BaseSqliteConnection {
  readonly #db: SqlJSDB
  readonly #onWrite: ((buffer: Uint8Array) => void) | undefined
  transactionNum = 0

  constructor(db: SqlJSDB, onWrite?: (buffer: Uint8Array) => void) {
    super()
    this.#db = db
    this.#onWrite = onWrite
  }

  query(sql: string, parameters?: readonly unknown[]) {
    const stmt = this.#db.prepare(sql)
    stmt.bind(parameters as any[])
    const rows = []
    while (stmt.step()) {
      rows.push(stmt.getAsObject())
    }
    stmt.free()
    return rows
  }

  exec(sql: string, param: any[]) {
    this.#db.run(sql, param as any[])
    const insertId = BigInt(this.query('SELECT last_insert_rowid() as id')[0].id)
    const numAffectedRows = BigInt(this.#db.getRowsModified())
    this.transactionNum === 0 && this.#onWrite && this.#onWrite(this.#db.export())
    return {
      numAffectedRows,
      insertId,
    }
  }
}
export const TRANSACTION_REGEX = /^(\s|;)*(?:begin|end|commit|rollback)/i
