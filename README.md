# MVP Template

Production-ready monorepo template for building cross-platform applications (iOS, Android, Web) with a Fastify backend. Start a new project in minutes, not days.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native 0.81 + Expo SDK 54 + Expo Router v6 |
| **UI** | Tamagui v2 (light/dark themes) |
| **Animations** | Reanimated v4 + Moti (declarative) |
| **Client State** | Zustand v5 + MMKV (native) / localStorage (web) |
| **Server State** | TanStack Query v5 |
| **i18n** | i18next + react-i18next (EN/RU/ES/JA) |
| **Backend** | Fastify v5 + TypeScript |
| **Database** | Drizzle ORM + PostgreSQL 16 |
| **Cache** | Redis 7 (ioredis) |
| **Auth** | JWT (access 15min + refresh 30d rotation) |
| **Push** | expo-notifications + expo-server-sdk |
| **Real-time** | SSE (Server-Sent Events) |
| **Analytics** | PostHog (abstraction layer) |
| **CI/CD** | GitHub Actions + EAS Build + Docker |
| **Monorepo** | npm workspaces + Turborepo |

## Project Structure

```
MVPTemplate/
├── apps/
│   ├── mobile/                 # Expo app (iOS/Android/Web)
│   │   ├── app/                # Expo Router — file-based routes
│   │   │   ├── _layout.tsx     # Root layout (providers)
│   │   │   ├── sign-in.tsx     # Sign in page
│   │   │   ├── sign-up.tsx     # Sign up page
│   │   │   ├── +not-found.tsx  # 404 page
│   │   │   └── (tabs)/        # Tab navigation (mobile) / Sidebar (web)
│   │   │       ├── _layout.tsx # Animated tab icons / web sidebar
│   │   │       ├── index.tsx   # Home screen
│   │   │       ├── explore.tsx # Explore + search
│   │   │       └── profile.tsx # Profile + inline edit
│   │   ├── src/
│   │   │   ├── features/       # auth, settings, search, onboarding, docs
│   │   │   ├── hooks/          # useAppTranslation, useQueryState
│   │   │   ├── services/       # api.ts, push.ts, sse.ts, query-client.ts
│   │   │   └── config/         # app.ts, navigation.ts
│   │   ├── assets/content/     # Privacy policy, terms of service (markdown)
│   │   └── public/             # sitemap.xml, robots.txt (web)
│   │
│   └── backend/                # Fastify API server
│       ├── src/
│       │   ├── config/         # env (zod), database, redis, logger
│       │   ├── modules/        # auth, users, push, notifications, search, settings
│       │   ├── common/         # middleware, errors, utils, types
│       │   ├── database/       # Drizzle schema + migrations
│       │   ├── realtime/       # SSE
│       │   └── jobs/           # Background jobs (push notifications)
│       └── docker/             # Dockerfile + docker-compose.dev.yml
│
├── packages/
│   ├── ui/                     # Shared UI components + Tamagui config
│   │   └── src/
│   │       ├── components/     # AppButton, AppInput, AppCard, AppAvatar
│   │       ├── animations/     # FadeIn, SlideIn, ScalePress, AnimatedTabIcon, RefreshSpinner
│   │       ├── feedback/       # StateView, ErrorBoundary
│   │       └── navigation/     # WebSidebar
│   ├── store/                  # Zustand stores (auth, theme, language, app, notes, bookmarks)
│   ├── i18n/                   # i18next config + 4 locale files (en, ru, es, ja)
│   ├── lib/                    # MMKV storage, secure storage, lazy loading
│   ├── analytics/              # PostHog abstraction (track, identify, feature flags, screen tracking)
│   └── config/                 # Shared ESLint + TS configs
│
└── .github/workflows/          # CI, backend deploy, EAS build
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** (for backend: PostgreSQL + Redis)
- **EAS CLI**: `npm install -g eas-cli` (for native builds)
- **Xcode** (iOS, macOS only)
- **Android Studio** (Android)

## Quick Start

### Option A: Frontend Only (Demo Mode)

The mobile app works **standalone without the backend** — auth falls back to demo mode automatically when the API is unreachable.

```bash
# Install all dependencies
npm install

# Start mobile app (all platforms)
npm run dev:mobile
```

Then open in iOS Simulator (`i`), Android Emulator (`a`), or web browser (`w`).

### Option B: Full Stack (with real backend)

#### 1. Start infrastructure

```bash
docker compose -f apps/backend/docker/docker-compose.dev.yml up -d
```

This starts PostgreSQL 16 (port 5432) and Redis 7 (port 6379).

#### 2. Configure backend environment

```bash
# Copy the template
cp apps/backend/.env.example apps/backend/.env
```

Generate secure JWT secrets and replace the placeholders in `.env`:

```bash
# Run this twice — once for JWT_ACCESS_SECRET, once for JWT_REFRESH_SECRET
openssl rand -hex 32
```

Edit `apps/backend/.env` and replace `change-me-access-secret-min-32-chars` with the generated values.

#### 3. Install dependencies and create database tables

```bash
npm install
npm run db:push -w apps/backend
```

#### 4. Start the backend

```bash
npm run dev -w apps/backend
```

Verify it's running:

```bash
curl http://localhost:3000/health
# → {"status":"ok","timestamp":"..."}
```

Swagger UI is available at http://localhost:3000/docs

#### 5. Configure mobile app

Create `apps/mobile/.env`:

```env
# For iOS Simulator / Android Emulator
EXPO_PUBLIC_API_URL=http://localhost:3000

# For physical device — use your machine's local IP instead:
# EXPO_PUBLIC_API_URL=http://192.168.x.x:3000

# PostHog analytics key (optional — leave empty for console.log fallback)
EXPO_PUBLIC_POSTHOG_KEY=
```

#### 6. Start mobile app

```bash
npm run dev:mobile
```

#### 7. Switch from demo to real auth

If you were previously using the demo account, **sign out first** in the app, then **sign up** with a new email and password. The app will create a real user account in PostgreSQL.

You can verify in the database:

```bash
docker exec -it $(docker ps -q -f ancestor=postgres:16-alpine) \
  psql -U postgres -d mvp_template -c "SELECT id, email, name FROM users;"
```

### Running everything at once

```bash
npm run dev
```

This starts both the mobile dev server and the backend API concurrently via Turborepo.

## Available Scripts

### Root (monorepo)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run dev:mobile` | Start mobile app only |
| `npm run dev:backend` | Start backend API only |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces (ESLint flat config) |
| `npm run typecheck` | Type-check all workspaces |
| `npm run clean` | Clean all build artifacts + node_modules |

### Mobile (`apps/mobile`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Expo dev server |
| `npm run ios` | Start on iOS simulator |
| `npm run android` | Start on Android emulator |
| `npm run web` | Start web version |
| `npm run build:web` | Export static web build |

### Backend (`apps/backend`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start with hot reload (tsx watch) |
| `npm run build` | Compile TypeScript |
| `npm run db:push` | Push schema to database |
| `npm run db:generate` | Generate migration files |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio (DB GUI) |

## Features

### Authentication
- JWT-based with access (15min) + refresh (30d) token rotation
- Refresh tokens stored as SHA-256 hashes in database
- Access token in memory (Zustand), refresh token in secure storage (Keychain/Keystore)
- Auto-refresh on 401 with request queue
- Rate limiting: 5 req/min on auth endpoints
- **Demo mode**: works without backend — falls back to local demo auth on network error

### Security
- **Rate limiting**: global (100 req/min), search (20 req/min), auth (5 req/min) — Redis-backed
- **Helmet**: CSP, HSTS (1 year + preload), strict referrer policy
- **Authorization**: all endpoints verify resource ownership (e.g., notifications belong to requesting user)
- **Input validation**: all inputs validated with Zod schemas (max lengths to prevent DoS)
- **CORS**: configurable origin via `CORS_ORIGIN` env var
- **No PII leaks**: search results return only id, name, avatar_url (no email)

### Theming
- Light/dark themes with Tamagui tokens
- System/light/dark mode selection
- Persisted in MMKV across app restarts

### Internationalization (i18n)
- **4 languages** included: English, Russian, Spanish, Japanese
- Device language auto-detection via `expo-localization`
- Manual language switching in settings
- All UI strings are translatable

### Animations (built-in)

| Component | Effect |
|-----------|--------|
| `FadeIn` | Opacity 0 → 1 with configurable delay |
| `SlideIn` | Slide from any direction |
| `ScalePress` | Spring scale on press (0.95 → 1.0) |
| `AnimatedListItem` | Staggered item appearance |
| `AnimatedTabIcon` | Tab bar icons with bounce/rotate/pop/wiggle/bell effects |
| `RefreshSpinner` | Custom animated loading spinner |
| Pull-to-refresh | Native `RefreshControl` on all scrollable screens |
| `StateView` | Crossfade between loading/error/empty/success |

### Navigation
- File-based routing with Expo Router v6
- Protected routes with auth guard
- Platform-adaptive: bottom tabs with animated icons (mobile), sidebar (web)
- 404 page

### Search
- PostgreSQL Full-Text Search with `tsvector` + GIN index
- Debounced search with `useDeferredValue`
- Recent searches persisted in MMKV
- Integrated into Explore screen

### Push Notifications
- `expo-notifications` permission flow + token registration
- Server-side chunked sending via `expo-server-sdk`
- Token cleanup on failed delivery

### Real-time (SSE)
- Server-Sent Events with heartbeat
- Auth via query param (EventSource API limitation)
- Auto-reconnect on connection loss
- Updates TanStack Query cache on events

### Analytics & Feature Flags
- PostHog abstraction layer (swappable provider)
- Graceful fallback to `console.log` when PostHog key is not set
- Automatic screen tracking via `usePathname()`
- Local + remote feature flags
- Identify on login, reset on logout

### SEO (Web)
- Meta tags via `+html.tsx` and `SEO` component
- Open Graph + Twitter Card support
- Static `sitemap.xml` and `robots.txt`

### Content & Documentation
- Markdown renderer for privacy policy and terms of service
- Localized privacy policies (per language)
- Contextual help sheet (bottom sheet per screen)

### Onboarding
- Intro slider on first launch (3 animated slides)
- Persisted completion status in MMKV

### UI Components
- `AppButton` — 5 variants (primary/secondary/outline/ghost/danger), 3 sizes, loading state, scale animation
- `AppInput` — label, error with shake animation, secure entry, accessibility labels
- `AppCard` — themed card with layout animation
- `AppAvatar` — image with fallback initials
- `StateView` — discriminated union for loading/error/empty/success states
- `ErrorBoundary` — catches render errors with fallback UI

## Backend API

Base URL: `http://localhost:3000/api`

Swagger UI: `http://localhost:3000/docs`

### Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/api/auth/register` | No | Create account |
| `POST` | `/api/auth/login` | No | Sign in |
| `POST` | `/api/auth/refresh` | No | Refresh tokens |
| `POST` | `/api/auth/logout` | Yes | Sign out |
| `GET` | `/api/auth/me` | Yes | Current user profile |
| `PATCH` | `/api/users/profile` | Yes | Update profile (name) |
| `GET` | `/api/users/settings` | Yes | Get user settings |
| `PUT` | `/api/users/settings` | Yes | Update user settings |
| `POST` | `/api/push/register` | Yes | Register push token |
| `DELETE` | `/api/push/unregister` | Yes | Remove push token |
| `POST` | `/api/push/send` | Yes | Send push notification |
| `GET` | `/api/notifications` | Yes | List notifications (paginated) |
| `PATCH` | `/api/notifications/:id/read` | Yes | Mark as read (owner only) |
| `GET` | `/api/search?q=...` | Yes | Full-text search users |
| `GET` | `/api/sse/events` | Yes | SSE event stream |
| `GET` | `/health` | No | Health check |

## Environment Variables

### Backend (`apps/backend/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mvp_template

# Redis
REDIS_URL=redis://localhost:6379

# JWT — IMPORTANT: generate unique secrets for your project!
# Use: openssl rand -hex 32
JWT_ACCESS_SECRET=<your-64-char-hex-secret>
JWT_REFRESH_SECRET=<your-64-char-hex-secret>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d

# Server
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# CORS (Expo dev server default port)
CORS_ORIGIN=http://localhost:8081

# Push Notifications — optional
# EXPO_ACCESS_TOKEN=your-expo-access-token
```

### Mobile (`apps/mobile/.env`)

```env
# Backend API URL (default: http://localhost:3000)
EXPO_PUBLIC_API_URL=http://localhost:3000

# PostHog analytics key (optional — leave empty for console.log fallback)
EXPO_PUBLIC_POSTHOG_KEY=
```

## Database

### Schema

| Table | Description |
|-------|-------------|
| `users` | id, email, password_hash, name, avatar_url, timestamps |
| `refresh_tokens` | id, user_id, token_hash (unique index), expires_at |
| `push_tokens` | id, user_id, token, platform (unique per user+platform) |
| `notifications` | id, user_id, title, body, type, data (JSONB), is_read, timestamps |
| `user_settings` | id, user_id (unique), settings (JSONB), timestamps |

All foreign keys cascade on delete. Indexes on `user_id` columns for query performance.

### Drizzle Studio

```bash
npm run db:studio -w apps/backend
```

Opens a GUI at `https://local.drizzle.studio` to browse and edit data.

## Deployment

### Mobile (EAS Build)

```bash
cd apps/mobile
eas build --platform ios
eas build --platform android
```

Configuration in `apps/mobile/eas.json`.

### Backend (Docker)

```bash
cd apps/backend
docker build -f docker/Dockerfile -t mvp-backend .
docker run -p 3000:3000 --env-file .env mvp-backend
```

The Dockerfile uses `node:20.11.0-alpine` with a multi-stage build and includes a `HEALTHCHECK`.

### CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — lint + typecheck on every push
- `.github/workflows/deploy-backend.yml` — Docker build + push on main
- `.github/workflows/eas-build.yml` — EAS Build on release tags

## Customizing the Template

### App Identity
Update `name`, `slug`, `bundleIdentifier`, `package` in `apps/mobile/app.config.ts` and replace icons/splash in `apps/mobile/assets/`.

### Brand Colors
Edit tokens in `packages/ui/tamagui.config.ts`. Light and dark theme colors are defined separately.

### Adding a New Language
1. Create `packages/i18n/src/locales/fr.json` (copy structure from `en.json`)
2. Import and add `fr` to the `resources` object in `packages/i18n/src/index.ts`
3. Add the language option to Settings screen in `apps/mobile/src/features/settings/`

### Adding a Backend Module
1. Create `apps/backend/src/modules/your-module/` with routes, service, repository files
2. Add Drizzle schema in `apps/backend/src/database/schema/`
3. Register routes in `apps/backend/src/app.ts`
4. Run `npm run db:push -w apps/backend` to create/update tables

### Switching from Demo to Production
1. Set up PostgreSQL + Redis (Docker locally, or managed services in production)
2. Generate JWT secrets with `openssl rand -hex 32` and configure `apps/backend/.env`
3. Push database schema: `npm run db:push -w apps/backend`
4. Set `EXPO_PUBLIC_API_URL` in `apps/mobile/.env` to your backend URL
5. For production: set `NODE_ENV=production` and configure proper `CORS_ORIGIN`
6. Sign out of demo account, then sign up with a real email — the app will use the backend API

## Known Issues

- **Tamagui v2 RC**: Web dev server may show `import.meta` syntax errors in dev mode. Static export (`npm run build:web`) works correctly.
- **MMKV + Expo Go**: Falls back to in-memory storage (data won't persist across reloads). Use a dev build (`npx expo run:ios`) for full MMKV persistence.
- **SSE + EventSource**: Browser/RN EventSource API doesn't support custom headers, so auth token is passed via query parameter.

## License

MIT


## TODO

- [ ] Лотти иконки не анимируются
- [ ] Админ панель не появляется 
- [ ] Обновить ридми под новые комманды, добавь какие-то комманды в файлы для автозапуска автоустановки, добавления админа и тд необходимых для инициализации приложения
