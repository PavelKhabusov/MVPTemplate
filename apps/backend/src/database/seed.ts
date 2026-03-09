/**
 * Seed script — creates default pricing plans if none exist.
 * Run: npm run db:seed -w apps/backend
 *
 * Plans use 'stripe' as provider by default. Change to 'yookassa', 'robokassa',
 * or 'paypal' as needed, or update providerPriceId after creating products
 * in your payment provider dashboard.
 *
 * Idempotent: skips seeding if any active plans already exist.
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { plans, users } from './schema/index'

// Load .env from backend root
dotenv.config({ path: new URL('../../.env', import.meta.url).pathname })

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set. Check apps/backend/.env')
  process.exit(1)
}

const connection = postgres(DATABASE_URL)
const db = drizzle(connection)

// ---------------------------------------------------------------------------
// Plan definitions
// Each plan can have an optional providerPriceId — fill in after creating
// products in Stripe / YooKassa dashboard. Leave empty for now.
// ---------------------------------------------------------------------------

type PlanSeed = {
  name: string
  description: string
  priceAmount: number   // cents (e.g. 1900 = $19.00)
  currency: string
  interval: 'month' | 'year' | 'one_time'
  features: string[]
  provider: 'stripe' | 'yookassa' | 'robokassa' | 'paypal' | 'polar'
  sortOrder: number
}

const defaultPlans: PlanSeed[] = [
  // ── Free ──────────────────────────────────────────────────────────────────
  {
    name: 'Free',
    description: 'Get started with 30 calls per month. No credit card required.',
    priceAmount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      '30 calls per month',
      'Call from browser (WebRTC)',
      'Phone number detection',
      'Call history',
    ],
    provider: 'stripe',
    sortOrder: 0,
  },

  // ── Pro Monthly (Stripe, USD) ─────────────────────────────────────────────
  {
    name: 'Pro',
    description: 'Unlimited calls, call recording, and auto-save to Google Sheets.',
    priceAmount: 990,    // $9.90 / month
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited calls',
      'Call recording',
      'Auto-save results to sheet',
      'Call via phone (callback)',
      'Priority support',
    ],
    provider: 'stripe',
    sortOrder: 1,
  },

  // ── Pro Yearly (Stripe, USD) ──────────────────────────────────────────────
  {
    name: 'Pro',
    description: 'Unlimited calls, call recording, and auto-save to Google Sheets.',
    priceAmount: 7900,   // $79 / year — saves ~33% vs monthly
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited calls',
      'Call recording',
      'Auto-save results to sheet',
      'Call via phone (callback)',
      'Priority support',
    ],
    provider: 'stripe',
    sortOrder: 2,
  },

  // ── Pro Monthly (YooKassa, RUB) ───────────────────────────────────────────
  {
    name: 'Pro',
    description: 'Безлимитные звонки, запись разговоров и автосохранение в таблицу.',
    priceAmount: 99000,  // 990₽ / month
    currency: 'rub',
    interval: 'month',
    features: [
      'Безлимитные звонки',
      'Запись разговоров',
      'Автосохранение в таблицу',
      'Звонок через телефон (callback)',
      'Приоритетная поддержка',
    ],
    provider: 'yookassa',
    sortOrder: 3,
  },

  // ── Pro Yearly (YooKassa, RUB) ────────────────────────────────────────────
  {
    name: 'Pro',
    description: 'Безлимитные звонки, запись разговоров и автосохранение в таблицу.',
    priceAmount: 790000, // 7900₽ / year — saves ~33% vs monthly
    currency: 'rub',
    interval: 'year',
    features: [
      'Безлимитные звонки',
      'Запись разговоров',
      'Автосохранение в таблицу',
      'Звонок через телефон (callback)',
      'Приоритетная поддержка',
    ],
    provider: 'yookassa',
    sortOrder: 4,
  },
]

async function seed() {
  console.log('🌱 Checking for existing plans...')

  const existing = await db.select().from(plans).where(eq(plans.isActive, true)).limit(1)

  if (existing.length > 0) {
    console.log('✅ Plans already exist — skipping plan seed.')
  } else {
    console.log(`📋 Inserting ${defaultPlans.length} default plans...`)

    for (const plan of defaultPlans) {
      const inserted = await db
        .insert(plans)
        .values({
          name: plan.name,
          description: plan.description,
          priceAmount: plan.priceAmount,
          currency: plan.currency,
          interval: plan.interval,
          features: plan.features,
          provider: plan.provider,
          sortOrder: plan.sortOrder,
          isActive: true,
        })
        .returning({ id: plans.id, name: plans.name, interval: plans.interval, priceAmount: plans.priceAmount })

      const p = inserted[0]
      const price = p.priceAmount === 0 ? 'Free' : `$${(p.priceAmount / 100).toFixed(2)}/${p.interval}`
      console.log(`  ✓ ${p.name} — ${price} (id: ${p.id})`)
    }
  }

  // ---------------------------------------------------------------------------
  // Default users (always upsert — update password if already exists)
  // ---------------------------------------------------------------------------
  console.log('\n👤 Seeding test accounts...')

  const SALT_ROUNDS = 12

  const seedUsers = [
    { email: 'admin@example.com', password: 'admin123', name: 'Admin', role: 'admin' as const },
    { email: 'user@example.com', password: 'user123', name: 'Test User', role: 'user' as const },
  ]

  for (const u of seedUsers) {
    const hash = await bcrypt.hash(u.password, SALT_ROUNDS)
    const [result] = await db.insert(users).values({
      email: u.email,
      passwordHash: hash,
      name: u.name,
      role: u.role,
      emailVerified: true,
    }).onConflictDoUpdate({
      target: users.email,
      set: { passwordHash: hash, name: u.name, role: u.role, emailVerified: true },
    }).returning({ id: users.id, email: users.email, role: users.role })
    console.log(`  ✓ ${result.role}: ${result.email} (password: ${u.password})`)
  }

  console.log('\n✅ Seed complete!')
  console.log('\nDefault credentials:')
  console.log('  Admin: admin@example.com / admin123')
  console.log('  User:  user@example.com / user123')
  console.log('\nNext steps:')
  console.log('  1. Configure your payment provider (Stripe / YooKassa / etc.) in apps/backend/.env')
  console.log('  2. Create matching products in your provider dashboard')
  console.log('  3. Update providerPriceId for each plan via admin panel or directly in the DB')
  console.log('  4. Set PAYMENTS_ENABLED=true in apps/backend/.env')

  await connection.end()
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
