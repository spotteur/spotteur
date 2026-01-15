import { drizzle } from 'drizzle-orm/node-postgres'

import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '@/constants/env'
import * as schema from '@/db/schema'

const db = drizzle({
  connection: {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
  schema,
})

export type DB = typeof db
export type DBTransaction = Parameters<Parameters<DB['transaction']>[0]>[0]

export default db
