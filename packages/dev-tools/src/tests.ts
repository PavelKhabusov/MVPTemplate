/**
 * Test definitions — shared between backend runner and frontend dashboard.
 */

export interface TestDef {
  id: string
  icon: string
  lucideIcon: string
  name: string
  desc: string
  group: 'unit' | 'specialized' | 'e2e' | 'quality'
  cmd: string
}

export type TestStatus = 'idle' | 'running' | 'passed' | 'failed'

export interface TestState {
  status: TestStatus
  log: string
  startedAt: number | null
  elapsed: string | null
  summary: string
  passed: number
  failed: number
  total: number
}

export const TESTS: TestDef[] = [
  // Unit tests
  { id: 'all', icon: '🧪', lucideIcon: 'flask-conical', name: 'Все юнит-тесты', desc: 'Проверяет всю логику приложения', group: 'unit', cmd: 'npx vitest run' },
  { id: 'backend', icon: '⚙️', lucideIcon: 'server', name: 'Backend', desc: 'API, авторизация, платежи', group: 'unit', cmd: 'npx vitest run --project backend' },
  { id: 'store', icon: '🗄️', lucideIcon: 'database', name: 'Store', desc: 'Хранилище данных (Zustand)', group: 'unit', cmd: 'npx vitest run --project store' },
  { id: 'lib', icon: '📚', lucideIcon: 'library', name: 'Библиотеки', desc: 'Утилиты и хелперы', group: 'unit', cmd: 'npx vitest run --project lib' },
  { id: 'i18n', icon: '🌍', lucideIcon: 'languages', name: 'Переводы', desc: 'Проверка en, ru, es, ja', group: 'unit', cmd: 'npx vitest run --project i18n' },
  // Specialized
  { id: 'coverage', icon: '📊', lucideIcon: 'bar-chart-3', name: 'Покрытие кода', desc: 'Минимум: 70%', group: 'specialized', cmd: 'npx vitest run --coverage' },
  { id: 'contracts', icon: '📝', lucideIcon: 'file-check', name: 'API-контракты', desc: 'Формат ответов API', group: 'specialized', cmd: 'npx vitest run --project backend -- api-contracts' },
  { id: 'schema', icon: '🗃️', lucideIcon: 'table-2', name: 'Схема БД', desc: 'Структура таблиц', group: 'specialized', cmd: 'npx vitest run --project backend -- schema-consistency' },
  { id: 'snapshots', icon: '📸', lucideIcon: 'camera', name: 'Снапшоты', desc: 'Обновить эталоны', group: 'specialized', cmd: 'npx vitest run -u --project backend' },
  // E2E
  { id: 'e2e', icon: '🌐', lucideIcon: 'globe', name: 'E2E Web', desc: 'Браузерные тесты', group: 'e2e', cmd: 'npx playwright test' },
  { id: 'e2e-ext', icon: '🧩', lucideIcon: 'puzzle', name: 'E2E Расширение', desc: 'Chrome extension', group: 'e2e', cmd: 'npx playwright test --config=playwright.extension.config.ts' },
  { id: 'e2e-visual', icon: '🎨', lucideIcon: 'image', name: 'Визуальная регрессия', desc: 'Скриншоты UI', group: 'e2e', cmd: 'npx playwright test tests/e2e/visual.spec.ts' },
  // Quality
  { id: 'lint', icon: '✅', lucideIcon: 'check-square', name: 'Lint + Типы', desc: 'ESLint + TypeScript', group: 'quality', cmd: 'npx turbo typecheck && npx eslint .' },
  { id: 'audit', icon: '🔒', lucideIcon: 'shield-alert', name: 'Аудит', desc: 'Уязвимости зависимостей', group: 'quality', cmd: 'npm audit --audit-level=critical' },
  { id: 'docker', icon: '🐳', lucideIcon: 'container', name: 'Docker', desc: 'Сборка образа backend', group: 'quality', cmd: 'docker build -f apps/backend/docker/Dockerfile -t mvp-backend:test apps/backend' },
  { id: 'ci', icon: '🚀', lucideIcon: 'rocket', name: 'Полный CI', desc: 'Lint → Тесты → Docker', group: 'quality', cmd: 'npx turbo typecheck && npx eslint . && npx vitest run && npx vitest run --coverage && docker build -f apps/backend/docker/Dockerfile -t mvp-backend:ci apps/backend' },
]

export const GROUP_LABELS: Record<string, string> = {
  unit: 'Юнит-тесты',
  specialized: 'Специализированные',
  e2e: 'E2E тесты',
  quality: 'Качество кода',
}

export const GROUPS = ['unit', 'specialized', 'e2e', 'quality'] as const
