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
| **Backend** | Fastify v5 + Drizzle ORM v0.38 + PostgreSQL 16 + Redis 7 |
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
│   │   │   ├── admin.tsx       # Admin panel
│   │   │   ├── pricing.tsx     # Payment plans
│   │   │   ├── docs/           # In-app documentation
│   │   │   ├── sign-in.tsx     # Auth screens
│   │   │   └── sign-up.tsx
│   │   └── src/features/       # auth, settings, search, onboarding
│   │
│   └── backend/                # Fastify API
│       ├── src/modules/        # auth, users, admin, push, notifications,
│       │                       # payments, analytics, search, config,
│       │                       # doc-feedback, email
│       ├── src/database/       # Drizzle schema + migrations
│       └── docker/             # Dockerfile + docker-compose
│
├── packages/
│   ├── ui/                     # Components, animations, landing page
│   ├── auth/                   # Auth forms, providers, flows
│   ├── store/                  # Zustand stores
│   ├── i18n/                   # 4 locales (EN/RU/ES/JA)
│   ├── lib/                    # MMKV, secure storage
│   ├── payments/               # Payment types, hooks, components
│   ├── docs/                   # In-app documentation engine
│   ├── template-config/        # Feature flags, color schemes
│   ├── config/                 # Shared configuration
│   └── analytics/              # PostHog abstraction
│
└── scripts/                    # PowerShell setup scripts
```

## API Endpoints

Base: `http://localhost:3000/api` | Swagger: `http://localhost:3000/docs`

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in |
| `POST` | `/auth/google` | — | Google sign-in (feature flag) |
| `POST` | `/auth/refresh` | — | Refresh tokens |
| `POST` | `/auth/logout` | Yes | Sign out |
| `GET` | `/auth/me` | Yes | Current user |
| `POST` | `/auth/verify-email` | — | Verify email token |
| `POST` | `/auth/request-password-reset` | — | Request password reset |
| `POST` | `/auth/reset-password` | — | Reset password with token |
| `POST` | `/auth/resend-verification` | Yes | Resend verification email |

### Users

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/users/profile` | Yes | Get current user profile |
| `PATCH` | `/users/profile` | Yes | Update profile (name, bio, phone, location, birthday) |
| `POST` | `/users/avatar` | Yes | Upload avatar (JPEG/PNG/WebP, max 5 MB) |
| `DELETE` | `/users/avatar` | Yes | Remove avatar |
| `GET` | `/users/settings` | Yes | Get user settings |
| `PATCH` | `/users/settings` | Yes | Update user settings |

### Search & Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/search?q=...` | Yes | Full-text search (rate limited: 20 req/min) |
| `GET` | `/notifications` | Yes | List notifications (paginated) |
| `PATCH` | `/notifications/:id/read` | Yes | Mark notification as read |
| `POST` | `/notifications/read-all` | Yes | Mark all as read |
| `GET` | `/sse/events` | Yes | SSE real-time stream |

### Push Notifications

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/push/register` | Yes | Register push token |
| `DELETE` | `/push/unregister` | Yes | Remove push token |
| `POST` | `/push/send` | Admin | Send notification to users |
| `GET` | `/push/history` | Admin | Notification send history |

### Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/payments/plans` | — | List active plans |
| `POST` | `/payments/checkout` | Yes | Create checkout session |
| `GET` | `/payments/subscription` | Yes | Current subscription |
| `POST` | `/payments/cancel` | Yes | Cancel subscription |
| `GET` | `/payments/history` | Yes | Payment history (paginated) |
| `POST` | `/payments/webhook/stripe` | — | Stripe webhook |
| `POST` | `/payments/webhook/yookassa` | — | YooKassa webhook |
| `GET` | `/payments/admin/stats` | Admin | Revenue & subscription stats |
| `GET` | `/payments/admin/plans` | Admin | List all plans (active + inactive) |
| `POST` | `/payments/admin/plans` | Admin | Create a plan |
| `PATCH` | `/payments/admin/plans/:id` | Admin | Update a plan |
| `DELETE` | `/payments/admin/plans/:id` | Admin | Deactivate a plan |

### Analytics & Feedback

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/analytics/events` | Yes | Ingest analytics events |
| `GET` | `/analytics/dashboard` | Admin | Aggregated metrics (users, sessions, screens) |
| `GET` | `/analytics/retention` | Admin | Cohort retention data |
| `POST` | `/doc-feedback` | Yes | Submit doc page feedback |
| `GET` | `/doc-feedback/:pageId` | Yes | Get user vote + page stats |
| `GET` | `/doc-feedback/admin/stats` | Admin | All doc feedback stats |

### Admin & Config

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/config/flags` | — | Public feature flags |
| `GET` | `/admin/users` | Admin | List users |
| `GET` | `/admin/users/:id` | Admin | User details |
| `PATCH` | `/admin/users/:id` | Admin | Update role/features |
| `GET` | `/admin/stats` | Admin | User statistics |
| `GET` | `/admin/config` | Admin | Available roles/features |
| `GET` | `/health` | — | Health check |

## Database Schema

| Table | Key Fields |
|-------|------------|
| `users` | email, name, avatar_url, bio, phone, location, birthday, role, features (JSONB), email_verified |
| `refresh_tokens` | user_id, token_hash, expires_at |
| `email_verification_tokens` | user_id, token_hash, expires_at, verified_at |
| `password_reset_tokens` | user_id, token_hash, expires_at, used_at |
| `push_tokens` | user_id, token, platform |
| `notifications` | user_id, title, body, type, data (JSONB), is_read |
| `user_settings` | user_id, settings (JSONB) |
| `analytics_events` | user_id, event, properties (JSONB), screen, created_at |
| `doc_feedback` | user_id, page_id, helpful (boolean) |
| `plans` | name, price_amount, currency, interval, features (JSONB), provider, provider_price_id |
| `subscriptions` | user_id, plan_id, status, provider, provider_subscription_id, current_period_start/end |
| `payments` | user_id, amount, currency, status, type, provider, provider_payment_id |

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
ANALYTICS_ENABLED=true                               # internal analytics ingestion
REQUEST_LOGGING=false                                 # log all HTTP requests
GOOGLE_CLIENT_ID=                                     # optional — enables Google sign-in
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

## Email (Optional)

Email functionality is disabled by default (`EMAIL_ENABLED=false`). When disabled, registration and login work as usual with no emails or verification checks.

### Setup

1. Set `EMAIL_ENABLED=true` in `apps/backend/.env`
2. Configure SMTP credentials:

   **Gmail (free, 500 emails/day):**
   ```env
   EMAIL_ENABLED=true
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your@gmail.com
   SMTP_PASS=your-app-password
   SMTP_FROM=your@gmail.com
   ```
   > Create an App Password: Google Account → Security → 2-Step Verification → App passwords

   **Yandex (free):**
   ```env
   SMTP_HOST=smtp.yandex.ru
   SMTP_PORT=465
   SMTP_USER=your@yandex.ru
   SMTP_PASS=your-app-password
   SMTP_FROM=your@yandex.ru
   ```

   **Any SMTP provider** — just set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`

3. Optional: Set `EMAIL_VERIFICATION_REQUIRED=true` to block sign-in for unverified users
4. In development without SMTP config, emails are captured by [Ethereal](https://ethereal.email) — check server console for preview URLs

### Email Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EMAIL_ENABLED` | `false` | Enable/disable all email functionality |
| `EMAIL_VERIFICATION_REQUIRED` | `false` | Block sign-in for unverified emails |
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | `587` | SMTP port (587 for TLS, 465 for SSL) |
| `SMTP_USER` | — | SMTP username |
| `SMTP_PASS` | — | SMTP password |
| `SMTP_FROM` | `noreply@example.com` | Sender email address |
| `APP_URL` | `http://localhost:8081` | Frontend URL for email links |

### What it adds

- **Email verification** on registration (verification link sent to inbox)
- **Password reset** flow (forgot password → email link → new password)
- **Welcome email** after successful verification
- Templates in 4 languages (EN/RU/ES/JA), inline-styled for email clients

## Push Notifications (Optional)

Push notifications are disabled by default. Enabling requires an Expo access token.

### Setup

1. Create an account at [expo.dev](https://expo.dev) (or sign in)
2. Go to **Settings** → **Access tokens** → **Create Token**
3. Set `EXPO_ACCESS_TOKEN` in `apps/backend/.env`:

   ```env
   EXPO_ACCESS_TOKEN=your-expo-access-token
   ```

4. Restart the backend — the `pushNotifications` feature flag activates automatically

### How It Works

- **Device registration**: on login, the app calls `registerForPushNotifications()` which requests permissions and sends the Expo push token to `POST /api/push/register`
- **Sending**: admin panel → Notify tab → enter title/body → Send to All. Calls `POST /api/push/send` which creates notification records, sends push via Expo, and emits SSE events
- **Receiving**: notifications appear in the system tray (native) and in the in-app Notification Center (Settings → Notifications)
- **Real-time**: SSE connection auto-refreshes the notification list when new notifications arrive (web only; native uses push)
- **User settings**: users can toggle push notifications on/off in Settings → Notifications. Disabling calls `DELETE /api/push/unregister` to remove device tokens

### Push Notification Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_ACCESS_TOKEN` | — | Expo access token (enables push feature) |

### Limitations

- Push notifications require a **physical device** (not simulator/emulator)
- Expo Go has limited push support — use a **dev build** for full functionality
- SSE (real-time events) works only on web; native uses push notifications
- `EXPO_ACCESS_TOKEN` is optional for development but recommended for production

## Payments (Optional)

Payments are disabled by default (`PAYMENTS_ENABLED=false`). Supports two providers: **Stripe** (international) and **YooKassa** (Russia). Both subscriptions and one-time payments are supported via redirect-based checkout.

### Setup

1. Set `PAYMENTS_ENABLED=true` in `apps/backend/.env`
2. Configure at least one provider:

   **Stripe:**
   ```env
   PAYMENTS_ENABLED=true
   STRIPE_SECRET_KEY=sk_test_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```
   > Get keys from [Stripe Dashboard](https://dashboard.stripe.com/apikeys). For webhooks, use `stripe listen --forward-to localhost:3000/api/payments/webhook/stripe` during development.

   **YooKassa:**
   ```env
   PAYMENTS_ENABLED=true
   YOOKASSA_SHOP_ID=your-shop-id
   YOOKASSA_SECRET_KEY=your-secret-key
   YOOKASSA_WEBHOOK_SECRET=your-webhook-secret
   ```
   > Get keys from [YooKassa Dashboard](https://yookassa.ru/my). Set webhook URL to `https://your-domain.com/api/payments/webhook/yookassa`.

3. Run `npm run db:push -w apps/backend` to create the `plans`, `subscriptions`, and `payments` tables
4. Restart the backend — the `payments` feature flag activates automatically
5. Create plans via the admin panel or `POST /api/payments/admin/plans`

### How It Works

- **Provider abstraction**: common `PaymentProvider` interface normalizes Stripe and YooKassa into a unified API
- **Checkout flow**: user selects a plan → `POST /api/payments/checkout` creates a session → redirect to hosted payment page (Stripe Checkout / YooKassa) → webhook confirms payment
- **Subscriptions**: managed via Stripe Billing (native) or locally in DB (YooKassa)
- **Admin panel**: Payments tab — create/edit/deactivate plans, revenue stats, active subscriptions, recent payments
- **User-facing**: pricing page at `/pricing` with billing interval toggle, subscription management in Settings

### Payment Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENTS_ENABLED` | `false` | Enable/disable payments module |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |
| `YOOKASSA_SHOP_ID` | — | YooKassa shop ID |
| `YOOKASSA_SECRET_KEY` | — | YooKassa secret key |
| `YOOKASSA_WEBHOOK_SECRET` | — | YooKassa webhook signing secret |

## Features

- **Auth**: JWT with refresh rotation, rate limiting (30 req/min), optional Google sign-in
- **Admin Panel**: role/feature management, user stats, plan CRUD, payment stats, doc feedback, notifications
- **Profile**: name, bio, phone, location, birthday, avatar upload (JPEG/PNG/WebP, 5 MB)
- **Navigation**: animated tab bar (mobile), collapsible sidebar with gradient indicator (web)
- **Animations**: bounce, rotate, pop, wiggle, bell tab icons + FadeIn, SlideIn, ScalePress
- **Themes**: light/dark with Tamagui, persisted in MMKV
- **i18n**: 4 languages, auto-detection, manual switching
- **Search**: PostgreSQL full-text with GIN index, debounced, rate limited
- **Push**: expo-notifications + expo-server-sdk, SSE real-time events
- **Analytics**: internal events ingestion + admin dashboard (active users, registrations, screens, retention cohorts), optional PostHog
- **Documentation**: in-app docs engine with feedback system (helpful/not helpful)
- **Config**: public `/config/flags` endpoint, frontend feature flag system with `useTemplateFlag`
- **SEO**: meta tags, OG/Twitter cards, sitemap
- **Payments**: Stripe + YooKassa, subscriptions & one-time, admin plan management, pricing page
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
