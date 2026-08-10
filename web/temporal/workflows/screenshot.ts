import { proxyActivities } from '@temporalio/workflow'

import type * as Activities from '@/temporal/activities'
import { type ScreenshotWorkflowResult, type ScreenshotWorkflowParams } from '@/types/screenshot'

const { getExistingSnapshot, processScreenshot } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '30 seconds',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 10,
    backoffCoefficient: 1.5,
  },
})

const { takeScreenshot } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '5 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 10,
    backoffCoefficient: 1.5,
  },
})

export async function screenshotWorkflow({
  payload,
  isRetrying,
}: ScreenshotWorkflowParams): Promise<ScreenshotWorkflowResult> {
  const existingSnapshot = await getExistingSnapshot({ snapshotId: payload.id })
  if (existingSnapshot && !isRetrying) {
    return { snapshot: existingSnapshot }
  }

  const logPrefix = `[${payload.id} - ${payload.browser} - ${payload.viewportWidth}px]`

  const { tempPath } = await takeScreenshot({ payload, logPrefix })
  const { snapshot } = await processScreenshot({ payload, tempPath, logPrefix })

  return { snapshot }
}
