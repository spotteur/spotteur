import { executeChild, proxyActivities } from '@temporalio/workflow'
import type * as Activities from '../activities/screenshot.ts'
import type { GenerateSnapshotsWorkflowParams, ScreenshotWorkflowParams } from '../types/screenshot.ts'

const { getScreenshotPaths, takeScreenshot, saveScreenshot } = proxyActivities<typeof Activities>({
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
  const ss = await takeScreenshot(ssOpts)
  const ssPath = await saveScreenshot(projectId, buildId, ssOpts.url, ss.buffer)
  return ssPath
}

/**
 * Workflow
 * @param args Workflow args
 */
export async function generateSnapshotsWorkflow({ projectId, buildId, ssOpts }: GenerateSnapshotsWorkflowParams) {
  const paths = await getScreenshotPaths(projectId)
  const results = await Promise.all(
    paths.map((path) => {
      return executeChild(screenshotWorkflow, { args: [{ projectId, buildId, ssOpts: { ...ssOpts, url: path } }] })
    }),
  )
  return `Successfully generated snapshots (${results.length} pages)`
}
