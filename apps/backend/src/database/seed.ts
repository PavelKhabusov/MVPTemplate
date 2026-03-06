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
    description: 'Get started at no cost. Perfect for exploring the platform.',
    priceAmount: 0,
    currency: 'usd',
    interval: 'month',
    features: [
      'Up to 3 projects',
      '1 GB storage',
      'Community support',
      'Core features included',
    ],
    provider: 'stripe',
    sortOrder: 0,
  },

  // ── Pro Monthly ────────────────────────────────────────────────────────────
  {
    name: 'Pro',
    description: 'For growing teams that need more power and flexibility.',
    priceAmount: 1900,   // $19 / month
    currency: 'usd',
    interval: 'month',
    features: [
      'Unlimited projects',
      '50 GB storage',
      'Priority email support',
      'Advanced analytics',
      'Team collaboration',
      'API access',
    ],
    provider: 'stripe',
    sortOrder: 1,
  },

  // ── Pro Yearly ─────────────────────────────────────────────────────────────
  {
    name: 'Pro',
    description: 'For growing teams that need more power and flexibility.',
    priceAmount: 15200,  // $152 / year — saves ~33% vs monthly
    currency: 'usd',
    interval: 'year',
    features: [
      'Unlimited projects',
      '50 GB storage',
      'Priority email support',
      'Advanced analytics',
      'Team collaboration',
      'API access',
    ],
    provider: 'stripe',
    sortOrder: 2,
  },

  // ── Enterprise Monthly ─────────────────────────────────────────────────────
  {
    name: 'Enterprise',
    description: 'Full control for large organizations with dedicated support.',
    priceAmount: 4900,   // $49 / month
    currency: 'usd',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9% uptime)',
      'SSO & advanced security',
      'On-premise deployment option',
      'Custom contracts & invoicing',
    ],
    provider: 'stripe',
    sortOrder: 3,
  },

  // ── Enterprise Yearly ─────────────────────────────────────────────────────
  {
    name: 'Enterprise',
    description: 'Full control for large organizations with dedicated support.',
    priceAmount: 39200,  // $392 / year — saves ~33% vs monthly
    currency: 'usd',
    interval: 'year',
    features: [
      'Everything in Pro',
      'Unlimited storage',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee (99.9% uptime)',
      'SSO & advanced security',
      'On-premise deployment option',
      'Custom contracts & invoicing',
    ],
    provider: 'stripe',
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
