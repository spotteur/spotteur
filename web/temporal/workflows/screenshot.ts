import { proxyActivities } from '@temporalio/workflow'

import type * as Activities from '@/temporal/activities/build'
import { type ScreenshotWorkflowResult, type ScreenshotWorkflowParams } from '@/types/screenshot'

const { takeScreenshot, processScreenshot, markBuildAsStarted } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})

/**
 * Workflow for generating screenshots and saving them to DB and S3.
 * @param args Workflow args
 */
export async function screenshotWorkflow({ payload }: ScreenshotWorkflowParams): Promise<ScreenshotWorkflowResult> {
  const logPrefix = `[${payload.id} - ${payload.browser} - ${payload.viewportWidth}px]`
  await markBuildAsStarted({ buildId: payload.buildId })
  const { tempPath } = await takeScreenshot({ payload, logPrefix })
  const { snapshot } = await processScreenshot({ payload, tempPath, logPrefix })

  return { snapshot }
}
