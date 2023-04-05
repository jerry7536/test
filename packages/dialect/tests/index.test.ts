import { describe, test } from 'vitest'
import init from 'sql.js'
import type { Generated } from 'kysely'
import { Kysely } from 'kysely'
import { SqlJsDialect } from '../src/sqljs-dialect'

interface DB {
  test: TestTable
}
interface TestTable {
  id: Generated<number>
  name: string
  blobtest: ArrayBufferLike
}
describe('dialect test', () => {
  test('sql.js', async () => {
    const dialect = new SqlJsDialect({
      async database() {
        const SQL = await init()
        return new SQL.Database()
      },
      onWrite(buffer) {
        console.log(buffer.length)
      },
    })
    const db = new Kysely<DB>({
      dialect,
    })
    await db.schema.createTable('test')
      .addColumn('id', 'integer', build => build.autoIncrement().primaryKey())
      .addColumn('name', 'text')
      .addColumn('blobtest', 'blob')
      .ifNotExists()
      .execute()
    for (let i = 0; i < 1e2; i++) {
      await db.transaction().execute((trx) => {
        return trx.insertInto('test')
          .values({
            name: `test at ${Date.now()}`,
            blobtest: Uint8Array.from([2, 3, 4, 5, 6, 7, 8]),
          })
          .execute()
      })
    }
  })
})
