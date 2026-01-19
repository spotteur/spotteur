import { proxyActivities } from '@temporalio/workflow'

import { type snapshots } from '@/db/schema'
import type * as Activities from '@/temporal/activities/build'
import { type ScreenshotWorkflowParams } from '@/types/screenshot'

const { takeScreenshot, processScreenshot } = proxyActivities<typeof Activities>({
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
export async function screenshotWorkflow({
  projectId,
  payload,
}: ScreenshotWorkflowParams): Promise<typeof snapshots.$inferSelect> {
  const tempPath = await takeScreenshot({
    url: payload.pageUrl,
    width: payload.viewportWidth,
    height: payload.viewportHeight,
    browser: payload.browser,
    selector: payload.selector,
  })

  return await processScreenshot({ projectId, payload, tempPath })
}
