# TDD Plan — MVPTemplate

## Текущее состояние

- **Vitest** настроен в `apps/backend/vitest.config.ts`
- **2 из 18 модулей** имеют тесты: `auth` (14 тестов), `payments` (10 тестов)
- **Playwright** упомянут, но нет конфига и нет E2E тестов
- **Frontend** — 0 тестов (packages/ui, packages/store и т.д.)
- **Coverage** настроен только для auth и payments

---

## Фаза 1: Backend Unit Tests (приоритет — HIGH)

### 1.1 Middleware (3 файла, ~6 тестов)

| Файл | Тесты | Что проверяем |
|------|-------|---------------|
| `common/middleware/authenticate.ts` | 4 | valid JWT -> userId в request; missing header -> 401; expired token -> 401; malformed token -> 401 |
| `common/middleware/require-admin.ts` | 2 | admin role -> next(); non-admin -> 403 |
| `common/middleware/error-handler.ts` | 4 | AppError -> correct statusCode + message; ZodError -> 400 + validation details; unknown error -> 500; Fastify validation error -> 400 |

**Путь**: `apps/backend/src/common/middleware/__tests__/`

### 1.2 Services без тестов (4 сервиса, ~30 тестов)

| Модуль | Тесты | Что проверяем |
|--------|-------|---------------|
| `email.service` | 5 | sendVerificationEmail; sendWelcomeEmail; sendPasswordResetEmail; sendBroadcast; disabled -> skip |
| `sms.service` | 4 | send via Twilio; send via SMSC; provider fallback; disabled -> skip |
| `push.service` | 5 | sendToUser; sendToMultiple; invalid token cleanup; no tokens -> skip; Expo SDK call format |
| `storage.service` | 6 | upload S3; upload local; delete S3; delete local; generate presigned URL; list files |

**Путь**: `apps/backend/src/modules/<name>/__tests__/`

### 1.3 Repositories (11 модулей, ~50 тестов)

> Интеграционные тесты с тестовой БД (или mock Drizzle)

| Модуль | Ключевые операции |
|--------|-------------------|
| `auth.repository` | findUserByEmail, createUser, saveRefreshToken, findRefreshToken, deleteRefreshToken, savePhoneVerificationCode, findPhoneVerificationCode |
| `payments.repository` | getActivePlans, createPlan, createSubscription, updateSubscriptionByProviderId, getPaymentHistory, getRevenueStats |
| `users.repository` | findById, updateProfile, updateSettings |
| `admin.repository` | listUsers (pagination + filters), updateUserRole, updateUserFeatures |
| `analytics.repository` | trackEvent, getEventsByUser, getEventStats |
| `calls.repository` | createCall, getCallHistory, updateCallStatus |
| `proxy.repository` | createProxy, listProxies, updateProxy, deleteProxy |
| `doc-feedback.repository` | createFeedback, getFeedbackByPage, getFeedbackStats |
| `sheet-templates.repository` | createTemplate, listTemplates, updateTemplate, deleteTemplate |
| `voximplant.repository` | saveCredentials, getCredentials |
| `notifications` | (routes only — тестировать через route injection) |

**Подход**: Mock Drizzle через `vi.mock('../../../config/database')` — тот же паттерн что в auth/payments.

### 1.4 Payment Providers (7 провайдеров, ~28 тестов)

| Провайдер | Тесты |
|-----------|-------|
| `stripe.provider` | 4: createCheckout, verifyWebhook, cancelSubscription, getSubscriptionStatus |
| `paypal.provider` | 4: createOrder, captureOrder, verifyWebhook, cancelSubscription |
| `yookassa.provider` | 4: createPayment, verifyWebhook, getPaymentStatus, refund |
| `robokassa.provider` | 4: generatePaymentUrl, verifyCallback, verifyWebhookSignature |
| `polar.provider` | 4: createCheckout, verifyWebhook, getSubscription |
| `paddle.provider` | 4: createCheckout, verifyWebhook, cancelSubscription |
| `dodo.provider` | 4: createPayment, verifyWebhook |

**Путь**: `apps/backend/src/modules/payments/providers/__tests__/`

### 1.5 Proxy Validator (~8 тестов)

| Тест | Описание |
|------|----------|
| testProxy valid | curl mock -> success |
| testProxy timeout | curl mock -> timeout error |
| testProxy auth fail | curl mock -> 407 |
| testProxyConnectivity | TCP connect mock -> ok/fail |
| diagnoseNetwork | mock child_process -> parsed output |

**Путь**: `apps/backend/src/modules/proxy/__tests__/proxy.validator.test.ts`

### 1.6 Utils & Config (~10 тестов)

| Файл | Тесты |
|------|-------|
| `common/utils/crypto.ts` | hashToken idempotent; encrypt/decrypt roundtrip; different inputs -> different hashes |
| `common/utils/retry.ts` | succeeds on first try; retries N times; gives up after max |
| `common/utils/response.ts` | sendSuccess format; with/without data |
| `config/env.ts` | valid env -> parsed; missing required -> throws; defaults applied |

**Путь**: `apps/backend/src/common/utils/__tests__/`, `apps/backend/src/config/__tests__/`

### 1.7 Zod Schemas (~15 тестов)

Для каждого `schema.ts` — валидация входных данных:
- `auth.schema` — register (valid/invalid email/password), login, sendPhoneCode, verifyPhone
- `payments.schema` — createPlan (valid/missing fields), updatePlan
- `users.schema` — updateProfile (valid/invalid), updateSettings
- `admin.schema` — listUsersQuery (pagination), updateUserAdmin
- `proxy.schema` — createProxy (valid/invalid host:port)

**Путь**: `apps/backend/src/modules/<name>/__tests__/<name>.schema.test.ts`

---

## Фаза 2: Backend Integration Tests (приоритет — MEDIUM)

### 2.1 Route Integration Tests

Используем `fastify.inject()` для тестирования HTTP endpoints без реального сервера.

**Настройка**:
```typescript
// apps/backend/src/test-utils/create-test-app.ts
import { buildApp } from '../app'

export async function createTestApp() {
  const app = await buildApp()
  await app.ready()
  return app
}
```

| Модуль | Endpoints | Тесты |
|--------|-----------|-------|
| `auth` | POST /register, /login, /refresh, /logout, /me | 8 |
| `users` | GET/PUT /profile, /settings | 4 |
| `admin` | GET /users, PUT /users/:id (role check) | 5 |
| `config` | GET /config, GET /company | 3 |
| `payments` | GET /plans, POST /checkout, POST /webhook/:provider | 6 |
| `storage` | POST /upload, DELETE /:fileId, GET /list | 4 |
| `notifications` | GET /list, PUT /read/:id | 3 |

**Путь**: `apps/backend/src/modules/<name>/__tests__/<name>.routes.test.ts`

### 2.2 SSE / Realtime (~4 теста)

| Тест | Описание |
|------|----------|
| connect with valid token | SSE stream opened, heartbeat received |
| connect without token | 401 |
| sendSSE to connected user | event delivered |
| sendSSE to disconnected user | no error, event dropped |

---

## Фаза 3: Frontend Unit Tests (приоритет — MEDIUM)

### 3.1 Настройка Vitest для packages

```bash
# Новые vitest.config.ts в каждом пакете или один в корне
# Root vitest.workspace.ts
```

```typescript
// vitest.workspace.ts (корень монорепо)
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
]
```

### 3.2 Zustand Stores (packages/store, ~32 теста)

| Стор | Тесты |
|------|-------|
| `auth.ts` | 6: setUser, clearUser, isAuthenticated, isInitialized, logout resets state |
| `theme.ts` | 5: setMode, resolvedTheme light/dark/system, persistence, hydration |
| `language.ts` | 3: setLanguage, persist, initial from device |
| `app.ts` | 4: hasCompletedOnboarding, lastRoute, persist, reset |
| `notes.ts` | 6: addNote, updateNote, deleteNote, listNotes, persist, CRUD ordering |
| `bookmarks.ts` | 4: add, remove, toggle, isBookmarked |
| `cookies.ts` | 2: accept, decline |
| `company.ts` | 2: setCompanyInfo, reset |

**Путь**: `packages/store/src/__tests__/`

### 3.3 Lib — Storage Adapter (~8 тестов)

| Тест | Описание |
|------|----------|
| web: localStorage get/set/delete | 3 теста |
| native: MMKV mock get/set/delete | 3 теста |
| fallback: in-memory when no storage | 2 теста |

**Путь**: `packages/lib/src/__tests__/`

### 3.4 i18n (~6 тестов)

| Тест | Описание |
|------|----------|
| initI18n sets default language | |
| changeLanguage persists | |
| all 4 locales have same keys | |
| useAppTranslation returns t function | |
| fallback to en for missing key | |
| interpolation works | |

**Путь**: `packages/i18n/src/__tests__/`

---

## Фаза 4: E2E Tests — Playwright (приоритет — MEDIUM)

### 4.1 Настройка

```typescript
// playwright.config.ts (корень)
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'npm run dev',
    port: 8081,
    reuseExistingServer: true,
  },
  use: {
    baseURL: 'http://localhost:8081',
  },
})
```

### 4.2 Auth Flow (~8 тестов)

| Тест | Описание |
|------|----------|
| Sign up with email | Форма -> success -> redirect |
| Sign up with existing email | -> error message |
| Sign in with valid credentials | -> redirect to home |
| Sign in with wrong password | -> error message |
| Forgot password flow | email input -> success message |
| Logout | button click -> redirect to sign-in |
| Protected route redirect | unauthenticated -> sign-in |
| Token refresh | expired access token -> auto refresh |

### 4.3 Settings (~6 тестов)

| Тест | Описание |
|------|----------|
| Toggle theme | dark/light switch works |
| Change language | UI updates to selected locale |
| Edit profile | change name -> save -> persisted |
| About modal | opens and closes |
| Notification modal | toggle switches work |
| Replay onboarding tour | resets and replays |

### 4.4 Landing Page (~4 теста)

| Тест | Описание |
|------|----------|
| Hero section renders | title, CTA visible |
| Features section | all feature cards visible |
| Navigation links | scroll to sections |
| Mobile responsive | viewport 375px, no overflow |

### 4.5 Payments (~4 теста)

| Тест | Описание |
|------|----------|
| Pricing page renders | plans visible |
| Select plan | -> checkout redirect |
| Active subscription shown | subscription badge in settings |
| Cancel subscription | confirmation dialog -> canceled |

### 4.6 Onboarding (~3 теста)

| Тест | Описание |
|------|----------|
| Wizard on first visit | all steps navigable |
| Coach mark tour | highlights appear sequentially |
| Skip tour | skip button -> tour ends |

---

## Фаза 5: CI/CD Pipeline (приоритет — LOW)

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  backend-unit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test -- --reporter=junit

  backend-integration:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_DB: test
          POSTGRES_PASSWORD: test
    steps:
      - run: npm run test:integration

  e2e:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright install
      - run: npm run test:e2e
```

---

## Порядок реализации

| # | Задача | Тестов | Время | Зависимости |
|---|--------|--------|-------|-------------|
| 1 | Middleware тесты | ~10 | - | Нет |
| 2 | Utils + Config тесты | ~10 | - | Нет |
| 3 | Zod Schema тесты | ~15 | - | Нет |
| 4 | Email/SMS/Push service тесты | ~14 | - | Нет |
| 5 | Storage service тесты | ~6 | - | Нет |
| 6 | Proxy validator тесты | ~8 | - | Нет |
| 7 | Payment providers тесты | ~28 | - | Нет |
| 8 | Repository тесты (mock DB) | ~50 | - | Нет |
| 9 | vitest.config обновление (coverage all) | - | - | 1-8 |
| 10 | Route integration тесты | ~33 | - | test-utils |
| 11 | Vitest workspace для frontend | - | - | Нет |
| 12 | Zustand store тесты | ~32 | - | 11 |
| 13 | Lib + i18n тесты | ~14 | - | 11 |
| 14 | Playwright setup | - | - | Нет |
| 15 | E2E Auth flow | ~8 | - | 14 |
| 16 | E2E Settings + Landing | ~10 | - | 14 |
| 17 | E2E Payments + Onboarding | ~7 | - | 14 |
| 18 | CI/CD pipeline | - | - | 1-17 |

**Итого: ~235 тестов**

---

## Правила TDD для проекта

1. **Red -> Green -> Refactor**: сначала пишем падающий тест, потом минимальную реализацию, потом рефакторим
2. **Каждый новый модуль** начинается с `__tests__/*.test.ts`
3. **Каждый PR** должен содержать тесты для измененного кода
4. **Coverage threshold**: 80% для новых модулей
5. **Naming**: `describe('moduleName')` -> `describe('methodName')` -> `it('does X when Y')`
6. **Mocking**: vi.mock() для внешних зависимостей (DB, API, SDK), никогда для тестируемого модуля
7. **No test interdependence**: каждый тест автономен, beforeEach с vi.clearAllMocks()
