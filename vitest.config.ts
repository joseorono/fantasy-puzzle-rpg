import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '~': path.resolve(__dirname, './src'),
      '@': path.resolve(__dirname, './public'),
    },
  },
  test: {
    coverage: {
      provider: 'istanbul' // or 'v8'
    },
  },
})