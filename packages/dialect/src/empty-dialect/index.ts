import type { Dialect, Kysely } from 'kysely'
import { DummyDriver, SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from 'kysely'

/**
 * Should only be used to generate sql statements
 */
export class EmptyDialect implements Dialect {
  createAdapter() {
    return new SqliteAdapter()
  }

  createDriver() {
    return new DummyDriver()
  }

  createIntrospector(db: Kysely<unknown>) {
    return new SqliteIntrospector(db)
  }

  createQueryCompiler() {
    return new SqliteQueryCompiler()
  }
}
