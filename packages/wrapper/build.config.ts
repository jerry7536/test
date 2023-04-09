import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig({
  entries: [
    'src/index',
  ],
  externals: [
    'kysely',
    'better-sqlite3',
    'sql.js',
  ],
  declaration: true,
  clean: true,
  rollup: {
    emitCJS: true,
  },
})
