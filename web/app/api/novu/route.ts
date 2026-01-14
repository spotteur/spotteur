import { Client, serve } from '@novu/framework/next'

import { NOVU_BACKEND_URL, NOVU_SECRET_KEY } from '@/constants/env'
import { buildCreatedNotification } from '@/novu/workflows/build-created'
import { buildFailedNotification } from '@/novu/workflows/build-failed'
import { buildPassedNotification } from '@/novu/workflows/build-passed'
import { buildReadyForReviewNotification } from '@/novu/workflows/build-ready-for-review'

const client = new Client({
  apiUrl: NOVU_BACKEND_URL,
  secretKey: NOVU_SECRET_KEY,
})

export const { GET, POST, OPTIONS } = serve({
  client,
  workflows: [
    buildCreatedNotification,
    buildPassedNotification,
    buildFailedNotification,
    buildReadyForReviewNotification,
  ],
})
