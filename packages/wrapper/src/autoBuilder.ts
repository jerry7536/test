import type { ColumnMetadata, KyselyPlugin, LogEvent } from 'kysely'
import { Kysely, sql } from 'kysely'

import { SqliteSerializePlugin } from 'kysely-plugin-serialize'
import type { DataTypeExpression } from 'kysely/dist/cjs/parser/data-type-parser'
import type { AutoSyncOption, ITable, TriggerEvent } from './types'
import { isBoolean, isString } from './util'

export class AutoSyncDB<DB extends Record<string, any>> {
  public kysely!: Kysely<DB>
  private tableMap!: Map<string, ITable<DB[Extract<keyof DB, string>]>>
  public constructor(option: AutoSyncOption<DB>) {
    const { dialect, tables, errorLogger, queryLogger, plugins: additionalPlugin } = option
    const plugins: KyselyPlugin[] = [new SqliteSerializePlugin()]
    additionalPlugin && plugins.push(...additionalPlugin)
    this.kysely = new Kysely<DB>({
      dialect,
      log: (event: LogEvent) => {
        event.level === 'error'
          ? (errorLogger && errorLogger(event.error))
          : (queryLogger && queryLogger(event.query, event.queryDurationMillis))
      },
      plugins,
    })
    this.tableMap = new Map()
    for (const tableName in tables) {
      if (!Object.prototype.hasOwnProperty.call(tables, tableName)) {
        continue
      }
      const table = tables[tableName]
      this.tableMap.set(tableName, table)
    }
  }

  private async createTimeTrigger(table: keyof DB, event: TriggerEvent, column: string, key = 'rowid') {
    // datetime('now') will return UTC Time
    await sql`
      create trigger if not exists ${sql.raw(table as string)}_${sql.raw(column)}
      after ${sql.raw(event)}
      on ${sql.table(table as string)}
      begin
        update ${sql.table(table as string)}
        set ${sql.ref(column)} = datetime('now','localtime')
        where ${sql.ref(key)} = NEW.${sql.ref(key)};
      end
      `.execute(this.kysely).catch((err) => {
        console.error(err)
        return undefined
      })
  }

  private getDataType(type: string): DataTypeExpression {
    let dataType: DataTypeExpression = 'text'
    switch (type) {
      case 'boolean':
      case 'date':
      case 'object':
      case 'string':
        dataType = 'text'
        break
      case 'increments':
      case 'number':
        dataType = 'integer'
        break
      case 'blob':
        dataType = 'blob'
    }
    return dataType
  }

  public async init() {
    const currentTables = (await this.kysely.introspection.getTables()).reduce((acc, obj) => {
      acc.set(obj.name, obj.columns)
      return acc
    }, new Map<string, ColumnMetadata[]>())

    for (const [tableName, tableProperty] of this.tableMap) {
      currentTables.has(tableName)
        ? await this.alterTable(tableName, tableProperty, currentTables.get(tableName) as ColumnMetadata[])
        : await this.createTable(tableName, tableProperty)
    }
  }

  private async alterTable(tableName: string, table: ITable<DB[Extract<keyof DB, string>]>, currentColumns: ColumnMetadata[]) {
    const { columns: columnList, property: tableProperty } = table
    for (const columnName in columnList) {
      if (!Object.prototype.hasOwnProperty.call(columnList, columnName)) {
        continue
      }
      const { type, defaultTo, notNull } = columnList[columnName]
      const current = currentColumns.find(v => v.name === columnName)
      const columnDataType = this.getDataType(type)
      if (current) {
        if (columnDataType !== current.dataType
          || (defaultTo === undefined ? current.hasDefaultValue : !current.hasDefaultValue)
          || notNull === current.isNullable
        ) {
          await this.kysely.schema
            .alterTable(tableName)
            .addColumn(`${columnName}_temp`, columnDataType, (builder) => {
              if (type === 'increments') {
                return builder.autoIncrement().primaryKey()
              }
              notNull && (builder = builder.notNull())
              defaultTo !== undefined && (builder = builder.defaultTo(defaultTo))
              return builder
            }).execute()
          await sql`update ${tableName}
                    set ${`${columnName}_temp`} = ${columnName}`
            .execute(this.kysely)
          await this.kysely.schema
            .alterTable(tableName)
            .dropColumn(columnName)
            .execute()
          await this.kysely.schema
            .alterTable(tableName)
            .renameColumn(`${columnName}_temp`, columnName)
            .execute()
        } else {
          continue
        }
      } else {
        await this.kysely.schema
          .alterTable(tableName)
          .addColumn(columnName, columnDataType, (build) => {
            if (defaultTo) {
              build = build.defaultTo(defaultTo)
            }
            if (notNull) {
              build = build.notNull()
            }
            return build
          }).execute()
      }
    }
  }

  private async createTable(tableName: string, table: ITable<DB[Extract<keyof DB, string>]>) {
    const { columns: columnList, property: tableProperty } = table
    let tableSql = this.kysely.schema.createTable(tableName)
    let _triggerKey = 'rowid'
    let _haveAutoKey = false
    let _insertColumnName
    let _updateColumnName
    if (tableProperty?.timestamp && !isBoolean(tableProperty.timestamp)) {
      const { create, update } = tableProperty.timestamp as { create?: string; update?: string }
      _insertColumnName = create
      _updateColumnName = update
    }
    for (const columnName in columnList) {
      if (!Object.prototype.hasOwnProperty.call(columnList, columnName)) {
        continue
      }
      const columnOption = columnList[columnName]
      const { type, notNull, defaultTo } = columnOption
      let dataType = this.getDataType(type)
      if (type === 'increments') {
        _triggerKey = columnName
      }
      if ([_insertColumnName, _updateColumnName].includes(columnName)) {
        continue
      }
      tableSql = tableSql.addColumn(columnName, dataType, (builder) => {
        if (type === 'increments') {
          _haveAutoKey = true
          return builder.autoIncrement().primaryKey()
        }
        notNull && (builder = builder.notNull())
        defaultTo !== undefined && (builder = builder.defaultTo(defaultTo))
        return builder
      })
    }
    if (tableProperty) {
      const _primary = tableProperty.primary as string | string[] | undefined
      const _unique = tableProperty.unique as string[] | (string[])[] | undefined
      if (tableProperty.timestamp) {
        if (_insertColumnName) {
          tableSql = tableSql.addColumn(_insertColumnName, 'date')
        }
        if (_updateColumnName) {
          tableSql = tableSql.addColumn(_updateColumnName, 'date')
        }
      }
      if (!_haveAutoKey && _primary) {
        const is = isString(_primary)
        _triggerKey = is ? _primary : _primary[0]
        tableSql = tableSql.addPrimaryKeyConstraint(`pk_${is ? _primary : _primary.join('_')}`, (is ? [_primary] : _primary) as any)
      }
      _unique?.forEach((u: string | string[]) => {
        const is = isString(u)
        _triggerKey = (!_primary && !_haveAutoKey) ? is ? u : u[0] : _triggerKey
        tableSql = tableSql.addUniqueConstraint(`un_${is ? u : u.join('_')}`, (is ? [u] : u) as any)
      })
    }
    await tableSql.ifNotExists().execute()
    if (tableProperty?.index) {
      for (const i of tableProperty.index) {
        const is = isString(i)
        let _idx = this.kysely.schema.createIndex(`idx_${is ? i : (i as []).join('_')}`).on(tableName)
        _idx = is ? _idx.column(i) : _idx.columns(i as [])
        await _idx.ifNotExists().execute()
      }
    }
    if (tableProperty?.timestamp) {
      _insertColumnName && await this.createTimeTrigger(tableName, 'insert', _insertColumnName, _triggerKey)
      _updateColumnName && await this.createTimeTrigger(tableName, 'update', _updateColumnName, _triggerKey)
    }
  }
}
