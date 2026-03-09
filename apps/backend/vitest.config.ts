import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    name: 'backend',
    root: resolve(__dirname),
    globals: true,
    environment: 'node',
    setupFiles: ['src/test-utils/setup-env.ts'],
    include: ['src/**/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/modules/**', 'src/common/**'],
      exclude: ['**/__tests__/**', '**/node_modules/**'],
      reporter: ['text', 'lcov'],
    },
  },
})
