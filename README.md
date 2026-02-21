# MVP Template

Production-ready monorepo template for cross-platform apps (iOS, Android, Web) with a Fastify backend.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native 0.81 + Expo SDK 54 + Expo Router v6 |
| **UI** | Tamagui v2 (light/dark themes) |
| **Animations** | Reanimated v4 + Moti |
| **State** | Zustand v5 + MMKV + TanStack Query v5 |
| **i18n** | i18next (EN/RU/ES/JA) |
| **Backend** | Fastify v5 + Drizzle ORM + PostgreSQL 16 + Redis 7 |
| **Auth** | JWT (access 15min + refresh 30d) |
| **Monorepo** | npm workspaces + Turborepo |

## Quick Start

### Full Setup (recommended)

```powershell
pwsh scripts/setup.ps1
```

Installs dependencies, starts Docker (PostgreSQL + Redis), generates `.env` with JWT secrets, pushes DB schema.

```powershell
# With admin user:
pwsh scripts/setup.ps1 -AdminEmail your@email.com
```

Then start:

```bash
npm run dev
```

### Frontend Only (no backend)

```bash
npm install && npm run dev:mobile
```

Backend must be running for authentication to work.

## Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start mobile + backend |
| `npm run dev:mobile` | Mobile only (press `i`/`a`/`w` for iOS/Android/Web) |
| `npm run dev:backend` | Backend only |
| `npm run build` | Build all |
| `npm run lint` | Lint all |
| `npm run typecheck` | Type-check all |
| `npm run clean` | Remove build artifacts + node_modules |

### PowerShell Utilities

| Command | Description |
|---------|-------------|
| `pwsh scripts/setup.ps1` | Full project setup |
| `pwsh scripts/setup.ps1 -AdminEmail user@email.com` | Setup + create admin |
| `pwsh scripts/make-admin.ps1 -Email user@email.com` | Grant admin role |
| `pwsh scripts/reset-db.ps1` | Drop all tables + re-push schema |
| `pwsh scripts/docker-start.ps1` | Start PostgreSQL + Redis |
| `pwsh scripts/docker-stop.ps1` | Stop containers |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:push -w apps/backend` | Push schema to DB |
| `npm run db:studio -w apps/backend` | Open Drizzle Studio GUI |
| `npm run db:generate -w apps/backend` | Generate migrations |
| `npm run db:migrate -w apps/backend` | Run migrations |

## Project Structure

```
MVPTemplate/
├── apps/
│   ├── mobile/                 # Expo (iOS/Android/Web)
│   │   ├── app/                # File-based routes
│   │   │   ├── _layout.tsx     # Root layout + web sidebar
│   │   │   ├── (tabs)/         # Tab bar (mobile) / Slot (web)
│   │   │   ├── settings.tsx    # Settings
│   │   │   ├── admin.tsx       # Admin panel
│   │   │   ├── sign-in.tsx     # Auth screens
│   │   │   └── sign-up.tsx
│   │   └── src/features/       # auth, settings, search, onboarding
│   │
│   └── backend/                # Fastify API
│       ├── src/modules/        # auth, users, admin, notifications, push, search, settings
│       ├── src/database/       # Drizzle schema + migrations
│       └── docker/             # Dockerfile + docker-compose
│
├── packages/
│   ├── ui/                     # Components, animations, navigation
│   ├── store/                  # Zustand stores
│   ├── i18n/                   # 4 locales
│   ├── lib/                    # MMKV, secure storage
│   └── analytics/              # PostHog abstraction
│
└── scripts/                    # PowerShell setup scripts
```

## API Endpoints

Base: `http://localhost:3000/api` | Swagger: `http://localhost:3000/docs`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in |
| `POST` | `/auth/google` | — | Google sign-in (feature flag) |
| `POST` | `/auth/refresh` | — | Refresh tokens |
| `POST` | `/auth/logout` | Yes | Sign out |
| `GET` | `/auth/me` | Yes | Current user |
| `PATCH` | `/users/profile` | Yes | Update profile (name, bio, phone, location) |
| `GET` | `/users/settings` | Yes | Get settings |
| `PUT` | `/users/settings` | Yes | Update settings |
| `GET` | `/search?q=...` | Yes | Full-text search |
| `GET` | `/notifications` | Yes | List notifications |
| `PATCH` | `/notifications/:id/read` | Yes | Mark as read |
| `POST` | `/push/register` | Yes | Register push token |
| `DELETE` | `/push/unregister` | Yes | Remove push token |
| `POST` | `/push/send` | Yes | Send notification |
| `GET` | `/sse/events` | Yes | SSE stream |
| `GET` | `/admin/users` | Admin | List users |
| `GET` | `/admin/users/:id` | Admin | User details |
| `PATCH` | `/admin/users/:id` | Admin | Update role/features |
| `GET` | `/admin/stats` | Admin | User statistics |
| `GET` | `/admin/config` | Admin | Available roles/features |
| `GET` | `/health` | — | Health check |

## Database Schema

| Table | Key Fields |
|-------|------------|
| `users` | email, name, bio, phone, location, role, features (JSONB) |
| `refresh_tokens` | user_id, token_hash, expires_at |
| `push_tokens` | user_id, token, platform |
| `notifications` | user_id, title, body, type, data (JSONB), is_read |
| `user_settings` | user_id, settings (JSONB) |

Roles: `user` (default) | `moderator` | `admin`

## Environment Variables

### Backend (`apps/backend/.env`)

Auto-generated by `setup.ps1`, or copy manually:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/mvp_template
REDIS_URL=redis://localhost:6379
JWT_ACCESS_SECRET=<openssl rand -hex 32>
JWT_REFRESH_SECRET=<openssl rand -hex 32>
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=30d
PORT=3000
HOST=0.0.0.0
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
GOOGLE_CLIENT_ID=                                # optional — enables Google sign-in
```

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_POSTHOG_KEY=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=               # optional — enables Google sign-in
```

For physical devices use your local IP: `http://192.168.x.x:3000`

## Google Sign-In (optional)

Google sign-in is a **feature flag** — the button only appears when `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` is set.

### Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a project (or select existing)
3. **OAuth consent screen** → External → fill app name, email, scopes (`email`, `profile`)
4. **Credentials** → Create OAuth client ID:
   - Application type: **Web application**
   - Authorized redirect URIs: `https://auth.expo.io/@your-username/mvp-template`
   - Copy the **Client ID**
5. Set environment variables:
   ```env
   # apps/mobile/.env
   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=123456789.apps.googleusercontent.com

   # apps/backend/.env
   GOOGLE_CLIENT_ID=123456789.apps.googleusercontent.com
   ```
6. Run `npm run db:push -w apps/backend` to update the schema (passwordHash is now nullable for OAuth users)

For production builds (EAS), create additional OAuth clients for iOS and Android and pass `iosClientId` / `androidClientId` to `useIdTokenAuthRequest` in `GoogleSignInButton.tsx`.

## Features

- **Auth**: JWT with refresh rotation, rate limiting (30 req/min), optional Google sign-in
- **Admin Panel**: role/feature management, user stats, protected by middleware
- **Profile**: name, bio, phone, location — inline editing
- **Navigation**: animated tab bar (mobile), collapsible sidebar with gradient indicator (web)
- **Animations**: bounce, rotate, pop, wiggle, bell tab icons + FadeIn, SlideIn, ScalePress
- **Themes**: light/dark with Tamagui, persisted in MMKV
- **i18n**: 4 languages, auto-detection, manual switching
- **Search**: PostgreSQL full-text with GIN index, debounced
- **Push**: expo-notifications + expo-server-sdk
- **SSE**: real-time events with auto-reconnect
- **Analytics**: PostHog abstraction with feature flags
- **SEO**: meta tags, OG/Twitter cards, sitemap
- **Security**: Helmet, CORS, Zod validation, rate limiting, no PII leaks

## Deployment

**Mobile**: `eas build --platform ios/android`

**Backend**: `docker build -f docker/Dockerfile -t mvp-backend . && docker run -p 3000:3000 --env-file .env mvp-backend`

**CI/CD**: GitHub Actions for lint/typecheck, Docker deploy, EAS Build

## Customization

- **App identity**: `apps/mobile/app.config.ts` + `assets/`
- **Colors**: `packages/ui/tamagui.config.ts`
- **New language**: add JSON in `packages/i18n/src/locales/`, register in `index.ts`
- **New module**: create in `apps/backend/src/modules/`, add schema, register in `app.ts`, run `db:push`

## Known Issues

- **Tamagui v2 RC**: `import.meta` errors in web dev mode; static export works
- **MMKV + Expo Go**: falls back to in-memory; use dev build for persistence
- **Physical device**: use local IP instead of `localhost` for API URL

## License

MIT
