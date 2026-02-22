# MVPTemplate

Production-ready monorepo template for cross-platform apps. Quick MVP launch with a full feature set out of the box.

**Stack**: Expo 54 + React Native 0.81 + Fastify 5 + PostgreSQL 16 + Redis 7
**Monorepo**: npm workspaces + Turbo
**Language**: TypeScript strict, ES modules

## Project Structure

```
apps/
  mobile/            Expo (iOS/Android/Web), Expo Router v6, Tamagui v2
  backend/           Fastify 5, Drizzle ORM 0.38, PostgreSQL + Redis
packages/
  ui/                Tamagui components, animations, landing page
  auth/              Auth forms, Google sign-in, providers
  payments/          PricingCard, SubscriptionBadge, payment hooks
  store/             Zustand stores (theme, auth, app, language, notes, bookmarks, cookies)
  i18n/              4 locales (en/ru/es/ja), i18next
  docs/              In-app documentation engine (markdown viewer)
  template-config/   Feature flags UI, color schemes
  analytics/         PostHog integration, screen tracking
  lib/               MMKV/AsyncStorage/localStorage abstraction, secure storage, phone masks
  config/            Shared constants (API_URL, timeouts, pagination)
scripts/             PowerShell: setup, docker, reset-db, make-admin, git-push
```

## Commands

```bash
npm run dev                        # Mobile + backend (turbo)
npm run dev:mobile                 # Expo dev server
npm run dev:backend                # Fastify backend
npm run db:push -w apps/backend    # Push Drizzle schema to DB
npm run db:studio -w apps/backend  # Drizzle Studio GUI
npm run db:generate -w apps/backend # Generate migrations
npm run db:migrate -w apps/backend  # Run migrations
pwsh scripts/setup.ps1             # Full project setup (deps + Docker + env + DB)
pwsh scripts/setup.ps1 -AdminEmail your@email.com
pwsh scripts/reset-db.ps1          # Drop all tables & re-push schema
pwsh scripts/make-admin.ps1        # Grant admin role by email
pwsh scripts/docker-start.ps1      # Start PostgreSQL + Redis
pwsh scripts/docker-stop.ps1       # Stop Docker containers
```

## Backend Architecture

**12 modules** in `apps/backend/src/modules/`:
auth, users, settings, admin, push, email, payments, analytics, notifications, search, config, doc-feedback

### Patterns

- **Route registration**: Fastify plugins with prefixes in `src/app.ts`
- **Auth middleware**: `preHandler: [authenticate]` or `preHandler: [authenticate, requireAdmin]`
- **Response format**: `{ data: T }` success, `{ data: T[], pagination: { page, limit, total, totalPages } }` lists, `{ error, message }` errors
- **Validation**: Zod schemas in `*.schema.ts`, parsed in route handlers
- **Feature flags**: env-driven, conditional route registration in `app.ts`:
  ```ts
  if (env.PAYMENTS_ENABLED) app.register(paymentsRoutes, { prefix: '/api/payments' })
  ```
- **Auth**: JWT access token (15m) + refresh token (30d), refresh token hashed in DB via `crypto.hashToken()`
- **Rate limiting**: 100 req/min global (Redis), 30/min auth, 20/min search
- **Module structure**: `routes.ts` + `service.ts` + `repository.ts` + `schema.ts`

### Database (13 tables)

Schema in `apps/backend/src/database/schema/`, all use UUID primary keys:

- users, refresh_tokens, user_settings
- push_tokens, notifications
- email_verification_tokens, password_reset_tokens
- analytics_events, doc_feedback
- plans, subscriptions, payments

### API Endpoints

| Prefix | Auth | Module |
|--------|------|--------|
| `/api/auth` | — | Register, login, Google OAuth, refresh, logout, password reset, email verify |
| `/api/users` | user | Profile CRUD, avatar upload/delete, settings |
| `/api/admin` | admin | User management, system stats |
| `/api/push` | mixed | Register/unregister tokens (user), send/history (admin) |
| `/api/notifications` | user | List, mark read, mark all read |
| `/api/search` | user | Full-text search `?q=&type=all|users` |
| `/api/analytics` | mixed | Ingest events (user), dashboard/retention (admin) |
| `/api/doc-feedback` | mixed | Submit/get feedback (user), stats (admin) |
| `/api/config` | — | Feature flags |
| `/api/payments` | mixed | Plans, checkout, subscription, cancel, history, webhooks, admin CRUD |
| `/api/sse` | user | Server-Sent Events real-time |

### Environment Variables

**Required**: `DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET` (32+ chars), `JWT_REFRESH_SECRET` (32+ chars)

**Feature toggles**: `EMAIL_ENABLED`, `PAYMENTS_ENABLED`, `ANALYTICS_ENABLED` (default: true), `REQUEST_LOGGING`

**Optional**: `GOOGLE_CLIENT_ID`, `EXPO_ACCESS_TOKEN`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY`, `YOOKASSA_WEBHOOK_SECRET`, `SMTP_HOST/PORT/USER/PASS/FROM`, `EMAIL_VERIFICATION_REQUIRED`, `APP_URL`

**Mobile**: `EXPO_PUBLIC_API_URL` (default: `http://localhost:3000`), `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`

## Frontend Architecture

### Routing

Expo Router file-based in `apps/mobile/app/`:
- **Tabs**: `(tabs)/` — home, explore, settings
- **Auth**: sign-in, sign-up, forgot-password, reset-password, verify-email (modals)
- **Screens**: edit-profile, docs, admin, pricing, payments/success, landing, privacy, terms

### UI & Theming

- Tamagui v2: light/dark themes, tokens in `packages/ui/tamagui.config.ts`
- Theme cycle: System → Light → Dark (persisted in MMKV via `useThemeStore`)
- Key tokens: `$background`, `$color`, `$accent`, `$mutedText`, `$cardBackground`, `$borderColor`
- Components in `packages/ui/src/components/`: AppButton, AppCard, AppInput, AppAvatar, AppSwitch, etc.
- Animations in `packages/ui/src/animations/`: FadeIn, SlideIn, ScalePress, AnimatedListItem, etc.

### State Management

Zustand stores in `packages/store/src/` with MMKV persistence:
- `useThemeStore` — mode (system/light/dark), resolvedTheme
- `useAuthStore` — user object, setUser, logout (in-memory, not persisted)
- `useAppStore` — hasCompletedOnboarding, lastRoute
- `useLanguageStore` — selected language
- `useNotesStore`, `useBookmarksStore`, `useCookieConsentStore`

### API Client

`apps/mobile/src/services/api.ts` — Axios with:
- Auto `Authorization: Bearer` header from secure storage
- Queue-based token refresh on 401
- Base URL: `${API_URL}/api`

### i18n

4 languages in `packages/i18n/src/locales/*.json`, auto-detects device language.
Usage: `const { t } = useTranslation()` then `t('namespace.key')`

### Feature Flags (Frontend)

```tsx
import { useTemplateFlag } from '@mvp/template-config'
const isEnabled = useTemplateFlag('payments', false)
```

11 flags: docs, email, emailVerification, googleAuth, requestLogging, analytics, posthog, cookieBanner, docFeedback, pushNotifications, payments

## Conventions

- All shared packages use `@mvp/` scope
- Backend module structure: `routes.ts` + `service.ts` + `repository.ts` + `schema.ts` (Zod)
- DB: UUID primary keys, `createdAt`/`updatedAt` timestamps
- Prices: stored in cents/kopecks (integer), display via `amount / 100`
- New UI component → `packages/ui/src/components/`, export from `index.ts`
- New screen → `apps/mobile/app/`, register in `_layout.tsx`
- New backend module → `apps/backend/src/modules/`, register in `app.ts`
- New DB table → `apps/backend/src/database/schema/`, export from `index.ts`, run `db:push`

## Important Gotchas

- **`Alert.alert` on web**: Button callbacks don't work reliably on React Native Web. Use:
  ```ts
  if (Platform.OS === 'web') { if (window.confirm(msg)) doAction() }
  else { Alert.alert(title, msg, [{ text: 'OK', onPress: doAction }]) }
  ```
- **Webhook raw body**: Stripe/YooKassa need raw body for signature verification. Use isolated Fastify plugin scope with `addContentTypeParser` to avoid breaking JSON parsing globally.
- **Storage abstraction**: `@mvp/lib` auto-selects MMKV (native dev build) > AsyncStorage (Expo Go) > localStorage (web) > in-memory Map (fallback).
- **Token refresh**: Axios interceptor queues requests during refresh. Don't call API directly — use the `api` instance from `apps/mobile/src/services/api.ts`.

## Auto-commit Hook

On Claude Code Stop event, `.claude/hooks/auto-push.sh` auto-commits changes to `claude/auto-YYYY-MM-DD` branch with message "auto: Claude changes HH:MM:SS".
