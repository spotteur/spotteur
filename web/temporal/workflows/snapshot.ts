import { executeChild, isCancellation, proxyActivities } from '@temporalio/workflow'

import type * as Activities from '@/temporal/activities'
import type { GenerateSnapshotsWorkflowParams } from '@/types/screenshot'

// Importing using aliases can cause issues with Temporal, so we use a relative path here
import { screenshotWorkflow } from './screenshot'
import { BuildStatus } from '../../constants/status-map'

const { notifyBuildReadyForReview } = proxyActivities<typeof Activities>({
  startToCloseTimeout: '1 minutes',
  retry: {
    initialInterval: '500 ms',
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
})

const { markBuildAsStarted, finalizeBuildSnapshots, getSingleSnapshotPayload, getSnapshotsPayload } = proxyActivities<
  typeof Activities
>({
  startToCloseTimeout: '30 seconds',
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

    await finalizeBuildSnapshots({ buildId, status: BuildStatus.WAITING_REVIEW })

    await notifyBuildReadyForReview({ projectId, buildId })

    return `Successfully generated snapshots (${snapshotPayloads.length} pages)`
  } catch (error) {
    if (isCancellation(error)) {
      throw error
    }

    await finalizeBuildSnapshots({ buildId, status: BuildStatus.ERROR })
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
    const payload = await getSingleSnapshotPayload({ projectId, snapshotId })
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
    if (isCancellation(error)) {
      throw error
    }

    await finalizeBuildSnapshots({ buildId, status: BuildStatus.ERROR })
    throw error
  }
}
