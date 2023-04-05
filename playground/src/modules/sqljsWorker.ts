import { SqlJsDialect, throttle } from 'kysely-wasm'
import InitSqlJS from 'sql.js'
import { writeFile } from './indexeddb'
import { testDB } from './utils'

const throttleFn = throttle<Uint8Array>({
  func: (s) => {
    console.log(`[sqljs worker] write to indexeddb, length: ${s.length}`)
    writeFile('sqlijsWorker', s)
  },
})

const dialect = new SqlJsDialect({
  async database() {
    const SQL = await InitSqlJS({
      // locateFile: file => `https://sql.js.org/dist/${file}`,
      locateFile: () => new URL('../../node_modules/sql.js/dist/sql-wasm.wasm', import.meta.url).href,
    })
    return new SQL.Database()
  },
  onWrite(buffer) {
    throttleFn(buffer)
  },
})
onmessage = () => {
  console.log('start sqljs test')
  testDB(dialect).then((data) => {
    data.forEach(e => console.log('[sqlijs]', e))
  })
}
