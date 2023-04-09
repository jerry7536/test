import initWasm from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { Kysely } from 'kysely'
import { EmptyDialect } from 'kysely-wasm'
import type { DB } from './utils'

export async function testCRSqlite() {
  const sqlite = await initWasm(() => wasmUrl)
  const db = await sqlite.open('crsqlite.db')
  const ky = new Kysely<DB>({ dialect: new EmptyDialect() })
  const { sql } = ky.schema.createTable('test')
    .addColumn('id', 'integer', build => build.autoIncrement().primaryKey())
    .addColumn('name', 'text')
    .addColumn('blobtest', 'blob')
    .ifNotExists().compile()
  db.exec(sql)
  const { sql: insertSql, parameters } = ky.insertInto('test')
    .values({
      name: `test at ${Date.now()}`,
      blobtest: Uint8Array.from([2, 3, 4, 5, 6, 7, 8]),
    }).compile()
  db.exec(insertSql, parameters as any)
  console.log(await db.execO('select * from test'))
  db.api.changes(db.db)
  db.onUpdate(console.log)
}
