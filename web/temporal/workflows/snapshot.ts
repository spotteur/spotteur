import { executeChild, proxyActivities } from '@temporalio/workflow'

import type * as Activities from '@/temporal/activities/project'
import type { GenerateSnapshotsWorkflowParams } from '@/types/screenshot'

import { screenshotWorkflow } from './screenshot'

const { getSnapshotsPayload } = proxyActivities<typeof Activities>({
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
  const snapshotPayloads = await getSnapshotsPayload({ projectId, buildId })
  const results = await Promise.all(
    snapshotPayloads.map((payload) => {
      return executeChild(screenshotWorkflow, { args: [{ projectId, payload }] })
    }),
  )

  // TODO: Notify project users, create notification(s) into db
  return `Successfully generated snapshots (${results.length} pages)`
}
