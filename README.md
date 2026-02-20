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
| **i18n** | i18next + react-i18next (EN/RU) |
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
│   │   │   └── (auth)/         # Protected routes (requires auth)
│   │   │       ├── settings.tsx
│   │   │       ├── privacy.tsx
│   │   │       └── (tabs)/     # Tab navigation (mobile) / Header (web)
│   │   │           ├── index.tsx
│   │   │           ├── explore.tsx
│   │   │           └── profile.tsx
│   │   ├── src/
│   │   │   ├── features/       # auth, settings, notifications, search, onboarding, docs
│   │   │   ├── hooks/          # useAppTranslation, useQueryState, useSearch
│   │   │   ├── services/       # api.ts, push.ts, sse.ts, query-client.ts
│   │   │   └── config/         # app.ts, navigation.ts
│   │   ├── assets/content/     # Privacy policy, terms of service
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
│   │       ├── animations/     # FadeIn, SlideIn, ScalePress, AnimatedList, SkeletonList
│   │       ├── feedback/       # StateView, ErrorBoundary
│   │       ├── navigation/     # WebHeader, Breadcrumbs
│   │       └── SEO.tsx
│   ├── store/                  # Zustand stores (auth, theme, language, app)
│   ├── i18n/                   # i18next config + locale files (en, ru)
│   ├── lib/                    # MMKV storage, secure storage, lazy loading
│   ├── analytics/              # PostHog abstraction (track, identify, feature flags)
│   └── config/                 # Shared ESLint + TS configs
│
└── .github/workflows/          # CI, backend deploy, EAS build
```

## Prerequisites

- **Node.js** >= 20
- **npm** >= 10
- **Docker** (for backend PostgreSQL + Redis)
- **Expo CLI**: `npm install -g expo-cli` (optional, npx works too)
- **EAS CLI**: `npm install -g eas-cli` (for native builds)
- **Xcode** (iOS development, macOS only)
- **Android Studio** (Android development)

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Run mobile app (frontend only)

The mobile app works standalone without the backend — auth falls back to demo mode automatically.

```bash
# All platforms
npm run dev:mobile

# Or specific platform
cd apps/mobile
npx expo start --ios
npx expo start --android
npx expo start --web
```

### 3. Run with backend (full stack)

```bash
# Start PostgreSQL + Redis
docker compose -f apps/backend/docker/docker-compose.dev.yml up -d

# Set up environment
cp apps/backend/.env.example apps/backend/.env

# Push database schema
cd apps/backend
npm run db:push

# Run everything
cd ../..
npm run dev
```

This starts both the mobile dev server and the backend API concurrently.

## Available Scripts

### Root (monorepo)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps in development mode |
| `npm run dev:mobile` | Start mobile app only |
| `npm run dev:backend` | Start backend API only |
| `npm run build` | Build all workspaces |
| `npm run lint` | Lint all workspaces |
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
- **Demo mode**: works without backend — falls back to local demo auth on network error

### Theming
- Light/dark themes with Tamagui tokens
- System/light/dark mode selection
- Persisted in MMKV across app restarts

### Internationalization
- English and Russian locales included
- Device language auto-detection
- Manual language switching in settings
- All UI strings are translatable

### Animations (built-in)
| Component | Effect |
|-----------|--------|
| `FadeIn` | Opacity 0 -> 1 with configurable delay |
| `SlideIn` | Slide from any direction |
| `ScalePress` | Spring scale on press (0.95 -> 1.0) |
| `AnimatedList` | Staggered item appearance |
| `SkeletonList` | Shimmer loading placeholders |
| `StateView` | Crossfade between loading/error/empty/success |

### Navigation
- File-based routing with Expo Router v6
- Protected routes with auth guard
- Platform-adaptive: bottom tabs (mobile), header + breadcrumbs (web)
- 404 page

### Search
- PostgreSQL Full-Text Search with `tsvector` + GIN index
- Debounced search with `useDeferredValue`
- Recent searches persisted in MMKV

### Push Notifications
- `expo-notifications` permission flow + token registration
- Server-side chunked sending via `expo-server-sdk`
- Token cleanup on failed delivery

### Real-time (SSE)
- Server-Sent Events with heartbeat
- Auto-reconnect on connection loss
- Updates TanStack Query cache on events

### Analytics & Feature Flags
- PostHog abstraction layer (swappable provider)
- Automatic screen tracking via `usePathname()`
- Local + remote feature flags
- Identify on login, reset on logout

### SEO (Web)
- Meta tags via `+html.tsx` and `SEO` component
- Open Graph + Twitter Card support
- Static `sitemap.xml` and `robots.txt`

### Content & Documentation
- Markdown renderer for privacy policy and terms of service
- Contextual help sheet (bottom sheet per screen)

### Onboarding
- Intro slider on first launch (3 animated slides)
- Persisted completion status in MMKV

### UI Components
- `AppButton` — 5 variants (primary/secondary/outline/ghost/danger), 3 sizes, loading state
- `AppInput` — label, error with shake animation, secure entry
- `AppCard` — layout animation on appear/disappear
- `AppAvatar` — image with fallback initials
- `StateView` — discriminated union for loading/error/empty/success states
- `ErrorBoundary` — catches render errors with fallback UI

## Backend API

Base URL: `http://localhost:3000/api`

Swagger UI available at `http://localhost:3000/docs` when running in development.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `POST` | `/api/auth/refresh` | Refresh tokens |
| `POST` | `/api/auth/logout` | Sign out |
| `GET` | `/api/auth/me` | Current user profile |
| `PATCH` | `/api/users/profile` | Update profile |
| `GET` | `/api/users/settings` | Get user settings |
| `PUT` | `/api/users/settings` | Update user settings |
| `POST` | `/api/push/register` | Register push token |
| `DELETE` | `/api/push/unregister` | Remove push token |
| `POST` | `/api/push/send` | Send push notification |
| `GET` | `/api/notifications` | List notifications |
| `PATCH` | `/api/notifications/:id/read` | Mark as read |
| `GET` | `/api/search` | Full-text search |
| `GET` | `/api/sse/events` | SSE stream |
| `GET` | `/health` | Health check |

## Environment Variables

Copy `.env.example` to `.env` in `apps/backend/`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mvp_template
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=change-me-access-secret-min-32-chars
JWT_REFRESH_SECRET=change-me-refresh-secret-min-32-chars
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
```

For the mobile app, set `EXPO_PUBLIC_API_URL` to point to your backend:

```bash
# In apps/mobile/.env (or inline)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Database

### Schema

- `users` — id, email, password_hash, name, avatar_url, timestamps
- `refresh_tokens` — id, user_id, token_hash, expires_at, revoked
- `push_tokens` — id, user_id, token, platform, timestamps
- `notifications` — id, user_id, title, body, read, data (JSONB), timestamps
- `user_settings` — id, user_id, settings (JSONB), timestamps

### Drizzle Studio

```bash
cd apps/backend
npm run db:studio
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

### CI/CD (GitHub Actions)

- `.github/workflows/ci.yml` — lint + typecheck on every push
- `.github/workflows/deploy-backend.yml` — Docker build + push on main
- `.github/workflows/eas-build.yml` — EAS Build on release tags

## Customizing the Template

1. **App name**: Update `name` and `slug` in `apps/mobile/app.config.ts`, `bundleIdentifier`/`package` for iOS/Android
2. **Brand colors**: Edit tokens in `packages/ui/tamagui.config.ts`
3. **Locales**: Add/edit JSON files in `packages/i18n/src/locales/`
4. **API URL**: Set `EXPO_PUBLIC_API_URL` environment variable
5. **Database schema**: Edit files in `apps/backend/src/database/schema/`, then run `npm run db:push`
6. **Add new features**: Create a new module in `apps/backend/src/modules/` and a feature folder in `apps/mobile/src/features/`

## Known Issues

- **Tamagui v2 RC**: Web dev server may show `import.meta` syntax errors in dev mode. Static export (`npm run build:web`) works correctly.
- **MMKV on Web**: Falls back to `localStorage` automatically (MMKV is native-only).

## License

MIT
