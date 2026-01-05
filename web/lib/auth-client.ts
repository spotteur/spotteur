import { inferAdditionalFields } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'

import { BETTER_AUTH_URL } from '@/constants/env'
import { type auth } from '@/lib/auth'

export const authClient = createAuthClient({
  baseURL: BETTER_AUTH_URL,
  plugins: [inferAdditionalFields<typeof auth>()],
})
