# CallSheet

Chrome extension for outbound calls directly from Google Sheets. Detects phone numbers on the page, calls via browser (WebRTC/Voximplant) or phone callback, auto-saves results to the spreadsheet.

## Features

- **Phone Detection** — automatically highlights phone numbers in any Google Sheet
- **Browser Calls (WebRTC)** — call via Voximplant without leaving the browser
- **Phone Callback** — cloud calls your phone first, then connects to the client
- **Auto-Save** — call status, duration, notes, recording link saved to spreadsheet
- **Call Recording** — all calls recorded (PRO plan), available for playback
- **Call History** — full log with search, filters, audio player
- **FREE / PRO plans** — 30 free calls/month, PRO unlimited via Stripe or YooKassa

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Extension** | React + Vite + Tailwind CSS + Lucide |
| **WebRTC** | Voximplant Web SDK |
| **Mobile App** | Expo SDK 54 + React Native + Tamagui |
| **Backend** | Fastify v5 + Drizzle ORM + PostgreSQL + Redis |
| **Auth** | JWT (access 15min + refresh 30d) |
| **Payments** | Stripe (USD) + YooKassa (RUB) |
| **i18n** | EN / RU / ES / JA |
| **Monorepo** | npm workspaces + Turborepo |

## Quick Start

### Full Setup (recommended)

```bash
pwsh scripts/setup.ps1 -AdminEmail your@email.com
npm run dev
```

Installs dependencies, starts Docker (PostgreSQL + Redis), generates `.env`, pushes DB schema, creates admin user.

### Extension Only

```bash
npm run dev:extension
```

Then: Chrome → `chrome://extensions` → Enable Developer mode → Load unpacked → select `apps/extension/dist/`

## Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start mobile app + backend |
| `npm run dev:mobile` | Mobile app only |
| `npm run dev:backend` | Backend only |
| `npm run dev:extension` | Extension (Vite HMR) |
| `npm run build:extension` | Production extension build |
| `npm run build` | Build all |
| `npm run lint` | Lint all |
| `npm run typecheck` | Type-check all |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:push -w apps/backend` | Push schema to DB |
| `npm run db:studio -w apps/backend` | Open Drizzle Studio |
| `npm run db:seed -w apps/backend` | Seed FREE/PRO plans |

### PowerShell Utilities

| Command | Description |
|---------|-------------|
| `pwsh scripts/setup.ps1` | Full project setup |
| `pwsh scripts/make-admin.ps1 -Email user@email.com` | Grant admin role |
| `pwsh scripts/reset-db.ps1` | Drop tables + re-push schema |
| `pwsh scripts/docker-start.ps1` | Start PostgreSQL + Redis |

## Project Structure

```
callsheet/
├── apps/
│   ├── extension/              # Chrome Extension (main product)
│   │   └── src/
│   │       ├── config.ts       # ← Extension customization (tabs, permissions)
│   │       ├── custom/         # ← CallSheet business logic
│   │       │   ├── CallTab.tsx
│   │       │   ├── HistoryTab.tsx
│   │       │   ├── VoximplantSettings.tsx
│   │       │   ├── ColumnMappingSettings.tsx
│   │       │   ├── backgroundHandlers.ts
│   │       │   ├── hooks/      # useCall, useContacts, useSheetColumns, useHistory
│   │       │   └── services/   # voximplant.ts, sheets.ts, api.ts
│   │       ├── content/        # Content scripts (phone detection, DOM injection)
│   │       └── components/     # Template shell (auth, onboarding, main screen)
│   │
│   ├── mobile/                 # Expo app (iOS/Android/Web)
│   │   └── app/(tabs)/         # Home (call stats), Statistics tab
│   │
│   └── backend/                # Fastify API
│       ├── src/modules/
│       │   ├── calls/          # Call history, limits (30/month FREE)
│       │   └── voximplant/     # VoIP connect, balance, webhooks
│       └── src/database/schema/
│           └── calls.ts        # Call records table
│
└── packages/
    ├── ui/                     # Shared UI + landing page
    ├── i18n/                   # 4 locales (EN/RU/ES/JA)
    ├── template-config/        # APP_BRAND, feature flags, color schemes
    └── docs/                   # In-app documentation (CallSheet guides)
```

## API Endpoints

Base: `http://localhost:3000/api` | Swagger: `http://localhost:3000/docs`

### CallSheet-specific

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/calls` | Yes | Call history (paginated, filters) |
| `POST` | `/calls` | Yes | Save call record |
| `GET` | `/calls/stats` | Yes | Monthly stats + FREE quota |
| `POST` | `/voximplant/connect` | Yes | Save Voximplant credentials (AES-256) |
| `GET` | `/voximplant/config` | Yes | Get Voximplant login + appId |
| `GET` | `/voximplant/balance` | Yes | Check Voximplant balance |

### Base (from template)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/auth/register` | — | Create account |
| `POST` | `/auth/login` | — | Sign in |
| `GET` | `/auth/me` | Yes | Current user |
| `GET` | `/payments/plans` | — | List plans (FREE/PRO) |
| `POST` | `/payments/checkout` | Yes | Create checkout session |
| `GET` | `/payments/subscription` | Yes | Current subscription |
| `GET` | `/health` | — | Health check |

## Database Schema

| Table | Key Fields |
|-------|------------|
| `users` | email, name, voximplant_login, voximplant_password (AES-256), voximplant_app_id |
| `calls` | user_id, sheet_id, row_index, contact_name, contact_phone, mode, status, duration, recording_url, note, started_at |
| `plans` | name, price_amount, currency, interval, provider |
| `subscriptions` | user_id, plan_id, status, provider, current_period_end |

## Environment Variables

### Backend (`apps/backend/.env`)

```env
# Database
DATABASE_URL=postgresql://callsheet:callsheet@localhost:5432/callsheet
REDIS_URL=redis://localhost:6379

# Auth
JWT_ACCESS_SECRET=<generate>
JWT_REFRESH_SECRET=<generate>

# Encryption (Voximplant credentials)
ENCRYPTION_KEY=<32-byte hex>

# Payments
PAYMENTS_ENABLED=true
STRIPE_ENABLED=true
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
YOOKASSA_ENABLED=true
YOOKASSA_SHOP_ID=xxx
YOOKASSA_SECRET_KEY=xxx

# Email
EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password

# Voximplant (admin API for balance check)
VOXIMPLANT_ACCOUNT_ID=
VOXIMPLANT_API_KEY=

# App
EXPO_PUBLIC_COLOR_SCHEME=indigo
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:8081
```

### Mobile (`apps/mobile/.env`)

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Extension Setup

### Load in Chrome

1. `npm run build:extension`
2. Chrome → `chrome://extensions` → Enable Developer mode
3. Load unpacked → select `apps/extension/dist/`
4. Pin the CallSheet icon to your toolbar

### First Use

1. Click the CallSheet icon on any Google Sheet
2. Sign in or create an account
3. Go to **Settings → Voximplant** — enter your VoIP credentials
4. Go to **Settings → Column Mapping** — map columns in your spreadsheet
5. Phone numbers on the sheet are highlighted automatically
6. Hover a number → click **Call**

### Voximplant Setup

1. Register at [manage.voximplant.com](https://manage.voximplant.com)
2. Create an Application
3. Create a User (login + password)
4. Note your Account ID and API key
5. Enter credentials in **Extension → Settings → Voximplant**

## Payments

**FREE plan**: 30 calls/month — no credit card required

**PRO plan**:
- $9.90/month or $79/year (Stripe, international)
- 990 ₽/month or 7 900 ₽/year (YooKassa, Russia)

To seed plans: `npm run db:seed -w apps/backend`

## Deployment

**Extension**: build → zip `apps/extension/dist/` → Chrome Web Store upload

**Backend**: `docker build -f docker/Dockerfile -t callsheet-backend . && docker run -p 3000:3000 --env-file .env callsheet-backend`

**Mobile**: `eas build --platform ios/android`

## License

MIT