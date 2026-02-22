# Ralph Fix Plan — MVPTemplate

## High Priority
- [ ] Add comprehensive error handling to YooKassa provider (retry logic, timeout handling)
- [ ] Add subscription renewal webhook handling for YooKassa (recurring payments)
- [ ] Add Stripe Customer Portal integration for self-service subscription management

## Medium Priority
- [ ] Add unit tests for payment providers (Stripe + YooKassa)
- [ ] Add unit tests for auth module (register, login, refresh, password reset)
- [ ] Improve admin panel: add user search/filter, pagination controls
- [ ] Add email templates preview in admin panel
- [ ] Add webhook retry logic and failed webhook logging

## Low Priority
- [ ] Add OpenAPI schema descriptions to all endpoints
- [ ] Add rate limit headers to API responses
- [ ] Optimize analytics dashboard queries (add DB indexes)
- [ ] Add CSV export for admin payment history
- [ ] Add bulk notification sending (target by plan, role, etc.)

## Completed
- [x] Project enabled for Ralph
- [x] Payment system (Stripe + YooKassa) — full implementation
- [x] Pricing page with billing interval toggle
- [x] Admin panel payments tab with stats and plan CRUD
- [x] README updated to match actual codebase
- [x] In-app documentation updated (all 4 locales)
- [x] CLAUDE.md created with full project context

## Notes
- Always keep 4 locale files in sync: en.json, ru.json, es.json, ja.json
- Run `npx tsc --noEmit -p apps/backend/tsconfig.json` to verify backend changes
- Prices are stored in cents/kopecks (integers), display by dividing by 100
