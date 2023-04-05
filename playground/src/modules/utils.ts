import type { Dialect, Generated } from 'kysely'
import { Kysely, sql } from 'kysely'

// type bufferItem = {
//   data: ArrayBufferLike
//   offset: number
//   hash: number
// }
// export function chunkBuffer(buffer: Uint8Array, chunkSize: number): bufferItem[] {
//   const chunks: bufferItem[] = []
//   for (let i = 0; i < buffer.byteLength; i += chunkSize) {
//     const data = buffer.slice(i, i + chunkSize)
//     chunks.push({ data, offset: i, hash: hash(data) })
//   }
//   return chunks
// }
// function hash(buffer: Uint8Array, maxHash = 99973) {
//   let hash = 0
//   for (let i = 0; i < buffer.byteLength; i++) {
//     const byte = buffer[i]
//     hash = (((byte << 2) + (byte >> 4)) ^ (byte << 10)) % maxHash
//     hash = hash < 0 ? hash + maxHash : hash
//   }
//   return hash
// }
interface DB {
  test: TestTable
}
interface TestTable {
  id: Generated<number>
  name: string
  blobtest: ArrayBufferLike
}
export async function testDB(dialect: Dialect) {
  const db = new Kysely<DB>({ dialect })
  await db.schema.createTable('test')
    .addColumn('id', 'integer', build => build.autoIncrement().primaryKey())
    .addColumn('name', 'text')
    .addColumn('blobtest', 'blob')
    .ifNotExists()
    .execute()
  console.log(await sql`PRAGMA table_info(${sql.table('test')});`.execute(db))

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

  return db.selectFrom('test').selectAll().execute()
}
