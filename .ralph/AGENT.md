# Ralph Agent Configuration — MVPTemplate

## Build Instructions

```bash
# Typecheck all packages
npx turbo typecheck

# Typecheck backend only
npx tsc --noEmit -p apps/backend/tsconfig.json

# Build backend
npm run build -w apps/backend
```

## Run Instructions

```bash
# Full dev (mobile + backend in parallel via Turbo)
npm run dev

# Backend only
npm run dev:backend

# Mobile only
npm run dev:mobile
```

## Database

```bash
# Push schema changes to DB
npm run db:push -w apps/backend

# Open Drizzle Studio
npm run db:studio -w apps/backend

# Generate migrations
npm run db:generate -w apps/backend

# Reset DB (drop all + re-push)
pwsh scripts/reset-db.ps1
```

## Docker (PostgreSQL + Redis)

```bash
pwsh scripts/docker-start.ps1   # Start
pwsh scripts/docker-stop.ps1    # Stop
```

## Project Structure

- Monorepo: npm workspaces + Turbo
- Backend: `apps/backend/` — Fastify 5 + Drizzle ORM + PostgreSQL + Redis
- Mobile: `apps/mobile/` — Expo 54 + React Native 0.81 + Expo Router v6
- Shared packages: `packages/*` (scope @mvp/*)
- Backend modules: `apps/backend/src/modules/` (12 modules)
- DB schema: `apps/backend/src/database/schema/`
- i18n: `packages/i18n/src/locales/{en,ru,es,ja}.json`

## Key Conventions

- TypeScript strict, ES modules
- Backend module: routes.ts + service.ts + repository.ts + schema.ts (Zod)
- UUID primary keys, createdAt/updatedAt timestamps
- Prices in cents/kopecks (integer)
- Feature flags: env-driven, conditional registration in app.ts
- Platform.OS === 'web' for web-specific code
- Alert.alert with callbacks doesn't work on web — use window.confirm()

## Notes

- CLAUDE.md in project root has full architecture documentation
- 4 locale files must stay in sync (en/ru/es/ja)
- Always run `npm run db:push -w apps/backend` after schema changes
