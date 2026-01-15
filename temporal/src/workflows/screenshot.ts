import { proxyActivities } from '@temporalio/workflow'
import type * as Activities from '../activities/build.ts'
import type { ScreenshotWorkflowParams } from '../types/screenshot.ts'

const { takeScreenshot, saveScreenshot } = proxyActivities<typeof Activities>({
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
export async function screenshotWorkflow({ projectId, buildId, ssOpts }: ScreenshotWorkflowParams) {
  const ssFile = await takeScreenshot(ssOpts) // save to /tmp
  const s3Path = await saveScreenshot({ projectId, buildId, url: ssOpts.url, file: ssFile })
  return s3Path
}
