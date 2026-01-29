import { serve } from '@novu/framework/next'

import { novuFrameworkClient } from '@/lib/novu'
import { buildCreatedNotification } from '@/novu/workflows/build-created'
import { buildFailedNotification } from '@/novu/workflows/build-failed'
import { buildPassedNotification } from '@/novu/workflows/build-passed'
import { buildReadyForReviewNotification } from '@/novu/workflows/build-ready-for-review'

export const dynamic = 'force-dynamic'

export const { GET, POST, OPTIONS } = serve({
  client: novuFrameworkClient,
  workflows: [
    buildCreatedNotification,
    buildPassedNotification,
    buildFailedNotification,
    buildReadyForReviewNotification,
  ],
})
