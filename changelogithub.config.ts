import { defineConfig } from 'changelogithub'

export default defineConfig({
  types: {
    feat: {
      title: '🚀 Features',
    },
    fix: {
      title: '🐞 Bug Fixes',
    },
    perf: {
      title: '🏎 Performance',
    },
  },
  output: 'CHANGELOG.md',
  draft: true,

})
