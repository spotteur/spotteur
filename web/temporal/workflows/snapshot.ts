import { executeChild, proxyActivities } from '@temporalio/workflow'

import type * as BuildActivities from '@/temporal/activities/build'
import type * as ProjectActivities from '@/temporal/activities/project'
import type { GenerateSnapshotsWorkflowParams } from '@/types/screenshot'

import { screenshotWorkflow } from './screenshot'

const { getSnapshotsPayload } = proxyActivities<typeof ProjectActivities>({
  startToCloseTimeout: '30 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})
const { finalizeBuildSnapshots, notifyBuildReadyForReview } = proxyActivities<typeof BuildActivities>({
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
  try {
    const snapshotPayloads = await getSnapshotsPayload({ projectId, buildId })
    const results = await Promise.all(
      snapshotPayloads.map((payload) => {
        return executeChild(screenshotWorkflow, {
          args: [{ projectId, payload }],
          workflowId: `build-${buildId}-snapshot-${payload.id}-${payload.browser.toString()}`,
        })
      }),
    )

    await finalizeBuildSnapshots({ buildId, isSuccess: true })

    await notifyBuildReadyForReview({ projectId, buildId })

    return `Successfully generated snapshots (${results.length} pages)`
  } catch (error) {
    console.error(error)
    await finalizeBuildSnapshots({ buildId, isSuccess: false })
    throw error
  }
}
