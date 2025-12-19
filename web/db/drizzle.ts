'use server'

import { drizzle } from 'drizzle-orm/node-postgres'

import { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } from '@/constants/env'

const db = drizzle({
  connection: {
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  },
})

export default db
