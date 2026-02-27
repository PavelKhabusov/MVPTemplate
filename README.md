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
│   │   │   ├── admin.tsx       # Admin panel
│   │   │   ├── pricing.tsx     # Payment plans
│   │   │   ├── docs/           # In-app documentation
│   │   │   ├── sign-in.tsx     # Auth screens
│   │   │   └── sign-up.tsx
│   │   └── src/features/       # auth, settings, search, onboarding
│   │
│   └── backend/                # Fastify API
│       ├── src/modules/        # auth, users, admin, push, payments, analytics, email, proxy, ...
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
│   ├── analytics/              # PostHog abstraction
│   ├── onboarding/             # Onboarding wizard + CoachMark tour
│   ├── ai/                     # AI provider types + config (Gemini, OpenAI)
│   └── proxy/                  # Proxy management types
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
| `POST` | `/auth/send-phone-code` | — | Send 6-digit SMS OTP |
| `POST` | `/auth/verify-phone` | — | Verify phone with OTP |
| `POST` | `/auth/verify-email` | — | Verify email token |
| `POST` | `/auth/request-password-reset` | — | Request password reset |
| `POST` | `/auth/reset-password` | — | Reset password with token |
| `POST` | `/auth/resend-verification` | Yes | Resend verification email |
| `PATCH` | `/users/profile` | Yes | Update profile (name, bio, phone, location) |
| `GET` | `/users/settings` | Yes | Get settings |
| `PUT` | `/users/settings` | Yes | Update settings |
| `GET` | `/search?q=...` | Yes | Full-text search |
| `GET` | `/notifications` | Yes | List notifications |
| `PATCH` | `/notifications/:id/read` | Yes | Mark as read |
| `POST` | `/push/register` | Yes | Register push token |
| `DELETE` | `/push/unregister` | Yes | Remove push token |
| `POST` | `/push/send` | Admin | Send notification to all/specific users |
| `GET` | `/push/history` | Admin | Notification send history |
| `POST` | `/notifications/read-all` | Yes | Mark all notifications as read |
| `GET` | `/sse/events` | Yes | SSE stream |
| `GET` | `/admin/users` | Admin | List users |
| `GET` | `/admin/users/:id` | Admin | User details |
| `PATCH` | `/admin/users/:id` | Admin | Update role/features |
| `GET` | `/admin/stats` | Admin | User statistics |
| `GET` | `/admin/config` | Admin | Available roles/features |
| `GET` | `/payments/plans` | — | List active plans |
| `POST` | `/payments/checkout` | Yes | Create checkout session |
| `GET` | `/payments/subscription` | Yes | Current subscription |
| `POST` | `/payments/cancel` | Yes | Cancel subscription |
| `GET` | `/payments/history` | Yes | Payment history (paginated) |
| `POST` | `/payments/webhook/stripe` | — | Stripe webhook |
| `POST` | `/payments/webhook/paypal` | — | PayPal webhook |
| `POST` | `/payments/webhook/yookassa` | — | YooKassa webhook |
| `POST` | `/payments/webhook/robokassa` | — | Robokassa webhook |
| `GET` | `/payments/admin/stats` | Admin | Revenue & subscription stats |
| `POST` | `/payments/admin/plans` | Admin | Create a plan |
| `GET` | `/admin/proxies` | Admin | List all proxies |
| `GET` | `/admin/proxies/:id` | Admin | Get proxy details |
| `POST` | `/admin/proxies` | Admin | Create proxy |
| `PUT` | `/admin/proxies/:id` | Admin | Update proxy |
| `DELETE` | `/admin/proxies/:id` | Admin | Delete proxy |
| `PATCH` | `/admin/proxies/:id/toggle` | Admin | Toggle proxy active state |
| `POST` | `/admin/proxies/:id/test` | Admin | Full HTTPS proxy test |
| `POST` | `/admin/proxies/:id/test-tcp` | Admin | TCP connectivity test |
| `GET` | `/admin/proxies/:id/diagnose` | Admin | Network diagnostics |
| `GET` | `/health` | — | Health check |

## Database Schema

| Table | Key Fields |
|-------|------------|
| `users` | email, name, bio, phone, location, role, features (JSONB), email_verified |
| `refresh_tokens` | user_id, token_hash, expires_at |
| `email_verification_tokens` | user_id, token_hash, expires_at, verified_at |
| `password_reset_tokens` | user_id, token_hash, expires_at, used_at |
| `push_tokens` | user_id, token, platform |
| `notifications` | user_id, title, body, type, data (JSONB), is_read |
| `user_settings` | user_id, settings (JSONB) |
| `plans` | name, price_amount, currency, interval, features (JSONB), provider, provider_price_id |
| `subscriptions` | user_id, plan_id, status, provider, provider_subscription_id, current_period_start/end |
| `payments` | user_id, amount, currency, status, type, provider, provider_payment_id |
| `proxies` | name, host, protocol, http_port, socks5_port, username, password, is_active, priority, last_check_status |

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
GEMINI_API_KEY=                                  # optional — Gemini AI provider
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=                                  # optional — OpenAI provider
OPENAI_MODEL=gpt-4o-mini
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

## SMS Verification (Optional)

Phone number verification via SMS OTP (6-digit code). Disabled by default. Supports two providers: **Twilio** (international) and **SMSC.ru** (Russia/CIS).

### Setup

1. Choose a provider and set credentials in `apps/backend/.env`:

   **Twilio:**
   ```env
   SMS_PROVIDER=twilio
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your-auth-token
   TWILIO_PHONE_NUMBER=+1234567890
   ```
   > Get credentials from [Twilio Console](https://console.twilio.com)

   **SMSC.ru:**
   ```env
   SMS_PROVIDER=smsc
   SMSC_LOGIN=your-login
   SMSC_PASSWORD=your-password
   SMSC_SENDER=YourApp
   ```
   > Get credentials from [SMSC.ru API](https://smsc.ru/api/)

2. Optionally enable phone verification requirement in **Admin → API Settings → SMS**

### How It Works

- User enters phone number → `POST /api/auth/send-phone-code` sends a 6-digit OTP
- User submits the code → `POST /api/auth/verify-phone` validates and marks phone as verified
- Codes are stored in `phone_verification_codes` table with a 10-minute expiry
- Admin panel → SMS tab: toggle required verification, switch active provider

### SMS Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SMS_PROVIDER` | — | `twilio` or `smsc` (enables SMS feature) |
| `TWILIO_ACCOUNT_SID` | — | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | — | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | — | Twilio sender phone number |
| `SMSC_LOGIN` | — | SMSC.ru login |
| `SMSC_PASSWORD` | — | SMSC.ru password |
| `SMSC_SENDER` | — | Sender name displayed on SMS |

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

Payments are disabled by default. Supports four providers: **Stripe** (international), **PayPal** (international), **YooKassa** (Russia), and **Robokassa** (Russia). Both subscriptions and one-time payments are supported via redirect-based checkout.

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
   ```
   > Get keys from [YooKassa Dashboard](https://yookassa.ru/my). Set webhook URL to `https://your-domain.com/api/payments/webhook/yookassa`.

   **PayPal:**
   ```env
   PAYMENTS_ENABLED=true
   PAYPAL_CLIENT_ID=your-client-id
   PAYPAL_CLIENT_SECRET=your-client-secret
   PAYPAL_WEBHOOK_ID=your-webhook-id
   PAYPAL_MODE=sandbox
   ```
   > Get credentials from [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/). Set `PAYPAL_MODE=live` for production.

   **Robokassa:**
   ```env
   PAYMENTS_ENABLED=true
   ROBOKASSA_MERCHANT_LOGIN=your-merchant-login
   ROBOKASSA_PASSWORD1=your-password1
   ROBOKASSA_PASSWORD2=your-password2
   ROBOKASSA_TEST_MODE=true
   ```
   > Get credentials from [Robokassa Dashboard](https://partner.robokassa.ru/). Set Result URL to `https://your-domain.com/api/payments/webhook/robokassa`.

3. Run `npm run db:push -w apps/backend` to create the `plans`, `subscriptions`, and `payments` tables
4. Restart the backend — the `payments` feature flag activates automatically
5. Create plans via the admin panel or `POST /api/payments/admin/plans`

### How It Works

- **Provider abstraction**: common `PaymentProvider` interface normalizes Stripe, YooKassa, and Robokassa into a unified API
- **Checkout flow**: user selects a plan → `POST /api/payments/checkout` creates a session → redirect to hosted payment page (Stripe Checkout / YooKassa / Robokassa) → webhook confirms payment
- **Subscriptions**: managed via Stripe Billing (native) or locally in DB (YooKassa, Robokassa)
- **Admin panel**: Payments tab shows revenue stats, active subscriptions count, and recent payments
- **User-facing**: pricing page at `/pricing`, subscription management in Settings → Manage Plan

### Payment Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PAYMENTS_ENABLED` | `false` | Enable/disable payments module |
| `STRIPE_SECRET_KEY` | — | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | — | Stripe webhook signing secret |
| `PAYPAL_CLIENT_ID` | — | PayPal client ID |
| `PAYPAL_CLIENT_SECRET` | — | PayPal client secret |
| `PAYPAL_WEBHOOK_ID` | — | PayPal webhook ID |
| `PAYPAL_MODE` | `sandbox` | `sandbox` or `live` |
| `YOOKASSA_SHOP_ID` | — | YooKassa shop ID |
| `YOOKASSA_SECRET_KEY` | — | YooKassa secret key |
| `ROBOKASSA_MERCHANT_LOGIN` | — | Robokassa merchant login |
| `ROBOKASSA_PASSWORD1` | — | Robokassa password #1 (checkout signature) |
| `ROBOKASSA_PASSWORD2` | — | Robokassa password #2 (webhook verification) |
| `ROBOKASSA_TEST_MODE` | `true` | Enable Robokassa test mode |

## Onboarding Tour (Optional)

The onboarding system is enabled by default (`EXPO_PUBLIC_ONBOARDING_ENABLED=true`). It runs on native (iOS/Android); on web, the wizard appears as a centered dialog.

### How It Works

- **Welcome Wizard** — full-screen multi-step modal on first launch (4 animated slides). Disabled after completion
- **CoachMark Tour** — spotlight-style interactive tour highlighting key UI elements after the wizard. Can be replayed from **Settings → App Tour**
- **Feature flag** — set `EXPO_PUBLIC_ONBOARDING_ENABLED=false` in `apps/mobile/.env` to remove all onboarding UI

### Customization

Edit wizard steps and tour stops in `apps/mobile/src/onboarding/steps.ts`.

### Onboarding Environment Variable

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_ONBOARDING_ENABLED` | `true` | Enable/disable onboarding wizard and tour |

## File Storage (Optional)

File storage defaults to **local filesystem**. Switch to **S3-compatible storage** (AWS S3, MinIO, Cloudflare R2) via admin panel without code changes.

### Setup

Configure in **Admin Panel → Storage** tab:

1. Select **S3** storage mode
2. Fill in endpoint, bucket, access key, secret key, region, and public URL
3. Save — changes persist to `.env` immediately

**Migrate existing files**: Admin Panel → Storage → Migrate to S3 uploads all local files to S3 and switches the provider.

### Storage Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `STORAGE_TYPE` | `local` | `local` or `s3` |
| `S3_ENDPOINT` | — | S3-compatible endpoint URL |
| `S3_BUCKET` | — | Bucket name |
| `S3_ACCESS_KEY` | — | Access key |
| `S3_SECRET_KEY` | — | Secret key |
| `S3_REGION` | — | Region (e.g. `us-east-1`) |
| `S3_PUBLIC_URL` | — | Public base URL for serving files |

## Template Config

The **Template Config** panel (accessible via the ⚙️ button on the landing page) lets you visually preview different feature combinations without touching code.

### What You Can Toggle

- Enable/disable features: docs, email, email verification, Google auth, analytics, PostHog, cookie banner, push notifications, payments, onboarding tour
- Switch color schemes (12 presets + custom hex) and border radius styles
- Choose web layout (sidebar / header / both), font family, and font scale
- Place language/theme toggles, search bar, and user badge anywhere in the navigation

Changes generate the corresponding `.env` snippet which you can copy and paste.

## AI Providers (Optional)

Supports **Google Gemini** and **OpenAI** with tab switching in the admin panel. Configure API keys via Admin → API Settings → AI Providers.

### AI Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GEMINI_API_KEY` | — | Google Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model (flash, pro, 3-pro-image, 2.0-flash) |
| `GEMINI_CONCURRENT_LIMIT` | `5` | Max concurrent AI requests |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `OPENAI_MODEL` | `gpt-4o-mini` | OpenAI model (gpt-4o, gpt-4o-mini, o3-mini) |
| `OPENAI_MAX_TOKENS` | `4096` | Max tokens per response |

## Proxy Management (Optional)

Full CRUD proxy management with testing, status tracking, and priority-based selection. Proxies are stored in the database (not `.env`) and managed via Admin → Proxies tab.

### Features

- **Add/edit/delete** proxies with name, host, protocol (HTTP/SOCKS5), ports, authentication
- **Priority-based** selection (lower value = higher priority)
- **Three test methods**: full HTTPS test (curl), TCP connectivity test, network diagnostics (DNS + TCP)
- **Status tracking**: last check time, status (success/failed/pending), error messages
- **Toggle active state** per proxy

## Features

- **Auth**: JWT with refresh rotation, rate limiting (30 req/min), optional Google sign-in, SMS OTP (Twilio + SMSC.ru)
- **Admin Panel**: role/feature management, user stats, proxy management, AI providers, protected by middleware
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
- **Payments**: Stripe + PayPal + YooKassa + Robokassa, subscriptions & one-time, admin stats
- **AI Providers**: Gemini + OpenAI with tab switching, model selection
- **Proxy Management**: CRUD with testing (HTTPS, TCP, diagnostics), priority, status tracking
- **File Storage**: local filesystem or S3-compatible (MinIO, Cloudflare R2), live migration in admin
- **Onboarding**: welcome wizard + interactive CoachMark spotlight tour, feature-flag-controlled
- **Template Config**: visual feature-flag panel with live preview and `.env` code export
- **Company Settings**: app name, tagline, company info — editable in admin, shown in footer/docs
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
