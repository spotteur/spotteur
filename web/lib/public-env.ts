import { createPublicEnv } from 'next-public-env'

import { DISABLE_REGISTRATION, NOVU_APP_IDENTIFIER, NOVU_BACKEND_URL, NOVU_WS_URL } from '@/constants/env'

export const { getPublicEnv, PublicEnv } = createPublicEnv({
  NODE_ENV: process.env.NODE_ENV,
  APP_ENV: process.env.APP_ENV,
  NOVU_APP_IDENTIFIER,
  NOVU_BACKEND_URL,
  NOVU_WS_URL,
  DISABLE_REGISTRATION,
})
