import { proxyActivities } from '@temporalio/workflow'

import type * as Activities from '@/temporal/activities/build'
import { type ScreenshotWorkflowResult, type ScreenshotWorkflowParams } from '@/types/screenshot'

const { getExistingSnapshot, takeScreenshot, processScreenshot } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '30 minutes',
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
