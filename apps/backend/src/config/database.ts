import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from './env.js'
import * as schema from '../database/schema/index.js'

const connection = postgres(env.DATABASE_URL)

export const db = drizzle(connection, { schema })
export type Database = typeof db
