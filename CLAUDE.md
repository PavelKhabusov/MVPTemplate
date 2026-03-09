# MVPTemplate — Инструкции для Claude

## Стек
- **Монорепо**: npm workspaces + Turborepo
- **Frontend**: Expo SDK 54, Expo Router v6, React Native 0.81, React 19, Tamagui v2 RC
- **Анимации**: react-native-reanimated v4 + moti v0.30
- **Состояние**: Zustand v5 + TanStack Query v5
- **i18n**: i18next (en, ru, es, ja)
- **Backend**: Fastify v5 + Drizzle ORM + PostgreSQL + Redis
- **Auth**: JWT (access + refresh rotation), bcrypt, OAuth
- **Платежи**: 7 провайдеров (Stripe, Paddle, Polar, PayPal, Yookassa, Robokassa, Dodo)
- **Тестирование**: Vitest (backend), Playwright (E2E web)

## Команды
```bash
npm run dev           # Все сервисы (turbo)
npm run dev:mobile    # Expo dev server
npm run dev:backend   # Fastify dev server
npm run typecheck     # TypeScript проверка
npm run lint          # ESLint
npm run test          # Vitest (backend)
npm run build         # Build all
```

## Структура
```
apps/mobile/          # Expo (iOS/Android/Web) — Expo Router v6
apps/backend/         # Fastify API — модули в src/modules/
apps/extension/       # Chrome Extension — config-driven
packages/ui/          # Tamagui компоненты, анимации, лендинг, навигация
packages/store/       # Zustand сторы (auth, theme, language, app)
packages/i18n/        # i18next + 4 локали
packages/lib/         # Storage adapters, утилиты
packages/auth/        # Auth UI компоненты
packages/onboarding/  # Wizard + CoachMark tour
packages/payments/    # Payment UI + hooks
packages/analytics/   # PostHog stub
packages/template-config/ # Feature flags, brand, color schemes
packages/docs/        # Documentation system
packages/notifications/   # Push + SSE
```

## Конвенции

### Именование
- Пакеты: `@mvp/*` (e.g. `@mvp/ui`, `@mvp/store`)
- Backend модули: `routes.ts` + `service.ts` + `repository.ts` + `schema.ts` + `__tests__/`

### Кросс-платформа
- Всегда проверяй `Platform.OS === 'web'` для платформенных различий
- **Модалки на web**: НИКОГДА не используй `<Modal>` — используй `AppModal` из `@mvp/ui` (createPortal)
- **Шрифты на web**: RNW atomic CSS перезаписывает font-family. Используй `applyFontFamily` (async)

### Gotchas
- **Tamagui v2 RC + web**: tslib ESM fix в `metro.config.js`
- **MMKV v4 на web**: не работает. Lazy `require()` для native, `localStorage` для web
- **.md файлы в Metro**: нельзя добавлять в sourceExts. Используй `.ts` с экспортом строки

### Тестирование (TDD)
- Backend: Vitest, тесты в `src/modules/*/\__tests__/*.test.ts`
- E2E: Playwright, тесты в `tests/e2e/`
- Подход: Red → Green → Refactor. Сначала тест, потом реализация

### i18n
- Все строки через `useAppTranslation()` из `@mvp/i18n`
- 4 локали: en, ru, es, ja — при добавлении ключа добавлять во все 4

## Агенты (.claude/agents/)
Загружай агента для специализированной работы:
- `senior-expo-architect` — архитектура frontend, кросс-платформа
- `backend-architect` — API, БД, модули backend
- `playwright-qa-tester` — E2E тесты, прокликивание UI
- `tdd-engineer` — test-first разработка
- `product-owner` — коммерческая оценка, UX
- `landing-ux-expert` — конверсия лендинга
- `context-keeper` — обновление документации/контекста

## Команды (.claude/commands/)
- `/project:load-context` — загрузить контекст проекта
- `/project:save-context` — сохранить находки в memory
- `/project:test-app` — запустить все проверки
- `/project:new-module` — создать backend-модуль
- `/project:quick-task` — быстрая задача
- `/project:visual-qa` — визуальная проверка UI
- `/project:orchestrate` — мульти-агентный воркфлоу

Подробнее: `.claude/ORCHESTRATION_GUIDE.md`
