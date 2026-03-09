import { render, toPlainText } from '@react-email/render'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { admin } from 'better-auth/plugins'

import { BETTER_AUTH_SECRET, BETTER_AUTH_URL, DISABLE_REGISTRATION, TRUSTED_ORIGINS } from '@/constants/env'
import db from '@/db/drizzle'
import { accounts, sessions, users, verifications } from '@/db/schema'
import ResetPasswordEmail from '@/emails/reset-password'
import { sendEmail } from '@/lib/mailer'

export const auth = betterAuth({
  baseURL: BETTER_AUTH_URL,
  secret: BETTER_AUTH_SECRET,
  trustedOrigins: TRUSTED_ORIGINS,
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
    disableSignUp: DISABLE_REGISTRATION,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      const htmlEmail = await render(ResetPasswordEmail({ actionLink: url }))
      const textEmail = toPlainText(htmlEmail)

      await sendEmail(user.email, 'Reset your password', htmlEmail, textEmail)
    },
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
  plugins: [admin()],
})
