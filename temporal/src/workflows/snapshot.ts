import { executeChild, proxyActivities } from '@temporalio/workflow'
import type * as Activities from '../activities/project.ts'
import type { GenerateSnapshotsWorkflowParams } from '../types/screenshot.ts'
import { screenshotWorkflow } from './screenshot.ts'

const { getScreenshotOptions } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})

/**
 * Workflow proxy for multi screenshot
 * @param args Workflow args
 */
export async function buildSnapshotsWorkflow({ projectId, buildId }: GenerateSnapshotsWorkflowParams) {
  const opts = await getScreenshotOptions(projectId)
  const results = await Promise.all(
    opts.map((opt) => {
      return executeChild(screenshotWorkflow, { args: [{ projectId, buildId, ssOpts: opt }] })
    }),
  )
  return `Successfully generated snapshots (${results.length} pages)`
}
