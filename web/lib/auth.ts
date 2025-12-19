import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'

import { BETTER_AUTH_SECRET } from '@/constants/env'
import db from '@/db/drizzle'
import { accounts, sessions, users, verifications } from '@/db/schema'

export const auth = betterAuth({
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: ['http://localhost:18000', 'http://127.0.0.1:18000'],
  database: drizzleAdapter(db, {
    schema: {
      users,
      verifications,
      accounts,
      sessions,
    },
    provider: 'pg',
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    additionalFields: {
      itemPerPage: {
        type: 'number',
      },
    },
  },
})
