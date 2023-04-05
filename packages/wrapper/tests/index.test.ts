import { equal } from 'node:assert'
import type { Generated } from 'kysely'
import { describe, test } from 'vitest'
import { SqliteDB } from '../src'

interface DB {
  test: TestTable
}
interface TestTable {
  id: Generated<number>
  person: { name: string } | null
  gender: boolean
  createAt: Date | null
  updateAt: Date | null
}
describe('test', () => {
  test('test', async () => {
    const db = new SqliteDB<DB>({
      dialect: {
        lib: 'better-sqlite3',
        path: ':memory:',
      },
      tables: {
        test: {
          column: {
            id: { type: 'increments' },
            person: { type: 'object', defaultTo: { name: 'test' } },
            gender: { type: 'boolean', notNull: true },
            createAt: { type: 'date' },
            updateAt: { type: 'date' },
          },
          property: {
            primary: 'id', // sqlite only support one single/composite primary key,
            index: ['person', ['id', 'gender']],
            timestamp: {
              create: 'createAt',
            },
          },
        },
      },
      dropTableBeforeInit: true,
      errorLogger: reason => console.error(reason),
      queryLogger: (queryInfo, time) => console.log(`${time}ms`, queryInfo.sql, queryInfo.parameters),
    })
    // manually generate table
    await db.init(true)
    // will auto generate table

    const { name, columns } = (await db.kysely.introspection.getTables())[0]
    equal(name, 'test')
    db.transaction(trx => trx.insertInto('test').values({ gender: false }).execute())

    // will auto generate table
      .then(() => db.exec(d => d.selectFrom('test').selectAll().execute()))
      .then((result) => {
        console.log('result:')
        console.log(result)
      })
      .then(() => {
        const { sql, parameters } = db.toSQL(d => d
          .selectFrom('test')
          .where('person', '=', { name: '1' })
          .selectAll(),
        )
        console.log(sql)
        console.log(parameters)
      })
      .then(async () => console.log(await db.raw(sql => sql`PRAGMA table_info(test);`)))
      .catch(console.error)
  })
})
