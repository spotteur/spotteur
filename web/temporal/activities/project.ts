import { ApplicationFailure } from '@temporalio/common'
import { and, eq } from 'drizzle-orm'

import db from '@/db/drizzle'
import { builds, projects } from '@/db/schema'
import { populateSnapshotsPayload } from '@/features/builds/actions'
import { type SnapshotPayload } from '@/types/screenshot'

export async function getSnapshotsPayload({
  projectId,
  buildId,
}: {
  projectId: string
  buildId: string
}): Promise<SnapshotPayload[]> {
  try {
    const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)
    if (!project) {
      throw ApplicationFailure.nonRetryable(`Project ID ${projectId} not found`)
    }

    const [build] = await db
      .select()
      .from(builds)
      .where(and(eq(builds.id, buildId), eq(builds.projectId, projectId)))
      .limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found for Project ID ${projectId}`)
    }

    const snapshotPayloads = await populateSnapshotsPayload({ project, build })

    return snapshotPayloads
  } catch (err) {
    if (err instanceof ApplicationFailure) {
      throw err
    }

    console.error(err)
    throw ApplicationFailure.retryable(`Failed to get snapshot payloads: ${err instanceof Error ? err.message : err}`)
  }
}
