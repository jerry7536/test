import type { DatabaseConnection } from 'kysely'
import { CompiledQuery } from 'kysely'

interface ThrottleParams<T> {
  func: (s: T) => void
  delay?: number
  maxCalls?: number
}

/**
 * Throttles a function call to a maximum number of calls per delay period.
 * @param func The function to throttle.
 * @param delay The delay period in milliseconds.
 * @param maxCalls The maximum number of calls allowed per delay period.
 * @returns A function that can be called with the same arguments as the original function, but will be throttled.
 *
 * @example
 * ```ts
 * const throttledFunc = throttle({ func: myFunction, delay: 2000, maxCalls: 1000 });
 * throttledFunc(myArgument);
 * ```
 */
export function throttle<T>({ func, delay = 2000, maxCalls = 1000 }: ThrottleParams<T>): (s: T) => void {
  let timer: any
  let callCount = 0
  let lastArgs: T | null = null

  function reset() {
    timer && clearTimeout(timer)
    callCount = 0
    lastArgs = null
  }

  function callFunc() {
    if (callCount >= maxCalls) {
      func(lastArgs!)
      reset()
    } else {
      timer && clearTimeout(timer)
      timer = setTimeout(() => {
        func(lastArgs!)
        reset()
        timer = undefined
      }, delay)
    }
  }

  return (s: T) => {
    callCount++
    lastArgs = s
    if (timer === undefined && callCount === 0) {
      func(s)
      callCount++
    } else {
      callFunc()
    }
  }
}
/**
 * Adds pragma to the sqlite connection.
 * @param conn The database connection.
 * @param cacheSize The cache size.
 * @param pageSize The page size.
 * @returns Promise<void>
 *
 * @example
 * default
 * ```ts
 * await addPragma(conn, 5000, 32 * 1024);
 * ```
 */
export async function optimzePragma(conn: DatabaseConnection, cacheSize = 5000, pageSize = 32 * 1024): Promise<void> {
  await conn.executeQuery(CompiledQuery.raw(
    `PRAGMA cache_size=${cacheSize};
     PRAGMA journal_mode=MEMORY;
     PRAGMA locking_mode = MEMORY;
     PRAGMA temp_store = 2;
     PRAGMA page_size=${pageSize};`,
  ))
}
