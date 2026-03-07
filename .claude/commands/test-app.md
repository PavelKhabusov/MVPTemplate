Запусти полную проверку проекта и выведи сводный отчёт.

## Шаги:

### 1. TypeScript
```bash
npx turbo typecheck
```

### 2. ESLint
```bash
npx turbo lint
```

### 3. Unit-тесты (Backend — Vitest)
```bash
cd apps/backend && npx vitest run
```

### 4. E2E тесты (если есть Playwright)
Проверь наличие `tests/e2e/` и `playwright.config.ts`. Если есть:
```bash
npx playwright test
```

## Формат отчёта:
```
=== СВОДКА ПРОВЕРКИ ===

TypeScript:  PASS / FAIL (N ошибок)
ESLint:      PASS / FAIL (N ошибок, M warnings)
Unit-тесты:  PASS / FAIL (N passed, M failed)
E2E тесты:   PASS / FAIL / SKIP (не настроены)

Критичные проблемы:
- [список, если есть]

Рекомендации:
- [что исправить в первую очередь]
```

Если указан аргумент `$ARGUMENTS`:
- `types` — только typecheck
- `lint` — только ESLint
- `unit` — только Vitest
- `e2e` — только Playwright
- `fix` — запустить с `--fix` для ESLint
