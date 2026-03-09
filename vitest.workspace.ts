export default [
  'apps/backend/vitest.config.ts',
  {
    test: {
      name: 'store',
      root: 'packages/store',
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'lib',
      root: 'packages/lib',
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'i18n',
      root: 'packages/i18n',
      environment: 'jsdom',
      include: ['src/**/__tests__/**/*.test.ts'],
    },
  },
]
