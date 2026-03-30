import { ApplicationFailure } from '@temporalio/common'

import { getSnapshotDetail, populateSingleSnapshotPayload } from '@/features/snapshots/actions'
import { logger } from '@/lib/logger'
import { type SnapshotPayload } from '@/types/screenshot'

export async function getSingleSnapshotPayload({
  snapshotId,
  buildId,
  projectId,
}: {
  snapshotId: string
  buildId: string
  projectId: string
}): Promise<SnapshotPayload> {
  try {
    const snapshotRes = await getSnapshotDetail({ projectId, buildId, snapshotId })
    if (snapshotRes) {
      const snapshot = snapshotRes.snapshot

      const payload = await populateSingleSnapshotPayload({ snapshotId: snapshot.id, projectId })

      return payload
    }

    throw ApplicationFailure.nonRetryable(`Snapshot ID ${snapshotId} not found for Project ID ${projectId}`)
  } catch (error) {
    if (error instanceof ApplicationFailure) {
      throw error
    }

    logger.error(error)
    throw ApplicationFailure.retryable(
      `Failed to get snapshot payloads: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}
