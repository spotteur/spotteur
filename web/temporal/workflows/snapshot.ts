import { executeChild, proxyActivities } from '@temporalio/workflow'

import type * as BuildActivities from '@/temporal/activities/build'
import type * as ProjectActivities from '@/temporal/activities/project'
import type * as SnapshotActivities from '@/temporal/activities/snapshot'
import type { GenerateSnapshotsWorkflowParams } from '@/types/screenshot'

import { screenshotWorkflow } from './screenshot' // Importing using aliases can cause issues with Temporal, so we use a relative path here

const { getSnapshotsPayload } = proxyActivities<typeof ProjectActivities>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})

const { markBuildAsStarted, finalizeBuildSnapshots, notifyBuildReadyForReview } = proxyActivities<
  typeof BuildActivities
>({
  startToCloseTimeout: '10 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})

const { getSingleSnapshotPayload } = proxyActivities<typeof SnapshotActivities>({
  startToCloseTimeout: '10 minutes',
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
    await markBuildAsStarted({ buildId })

    const snapshotPayloads = await getSnapshotsPayload({ projectId, buildId })

    await Promise.all(
      snapshotPayloads.map((payload) => {
        return executeChild(screenshotWorkflow, {
          args: [{ payload }],
          workflowId: `build-${buildId}-snapshot-${payload.id}-${payload.browser.toString()}`,
          retry: {
            initialInterval: '500 ms',
            maximumAttempts: 3,
            backoffCoefficient: 1.5,
          },
        })
      }),
    )

    await finalizeBuildSnapshots({ buildId, isSuccess: true })

    await notifyBuildReadyForReview({ projectId, buildId })

    return `Successfully generated snapshots (${snapshotPayloads.length} pages)`
  } catch (error) {
    await finalizeBuildSnapshots({ buildId, isSuccess: false })
    throw error
  }
}

export async function retrySingleSnapshotWorkflow({
  projectId,
  buildId,
  snapshotId,
}: {
  projectId: string
  buildId: string
  snapshotId: string
}) {
  try {
    const payload = await getSingleSnapshotPayload({ projectId, buildId, snapshotId })
    return executeChild(screenshotWorkflow, {
      args: [{ payload, isRetrying: true }],
      workflowId: `build-${buildId}-snapshot-${payload.id}-${payload.browser.toString()}`,
      retry: {
        initialInterval: '500 ms',
        maximumAttempts: 3,
        backoffCoefficient: 1.5,
      },
    })
  } catch (error) {
    await finalizeBuildSnapshots({ buildId, isSuccess: false })
    throw error
  }
}
