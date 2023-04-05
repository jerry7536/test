import { SqlJsDialect, throttle } from 'kysely-wasm'
import InitSqlJS from 'sql.js'
import { ref } from 'vue'
import { writeFile } from './indexeddb'
import { testDB } from './utils'

const throttleFn = throttle<Uint8Array>({
  func: (data: Uint8Array) => {
    console.log(`[sqljs] write to indexeddb, length: ${data.length}`)
    writeFile('sqljs', data)
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
export function useDB() {
  const result = ref()
  function run() {
    testDB(dialect).then((data) => {
      result.value = data
    })
  }

  return { result, run }
}
