'use server'

import { and, count, asc, desc, eq, ilike, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_FAILED, NOVU_WORKFLOW_BUILD_PASSED } from '@/constants/novu'
import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import db, { type DB, type DBTransaction } from '@/db/drizzle'
import { builds, media, projects, snapshots } from '@/db/schema'
import { getNovuSubscribers } from '@/features/builds/actions'
import novu from '@/lib/novu'
import { sha256Hex } from '@/lib/utils'
import { type SnapshotPayload } from '@/types/screenshot'

type SortKey = 'id' | 'diffPercentage' | 'createdAt' | 'updatedAt' | ''

const sortColumn = (key: SortKey) => {
  switch (key) {
    case 'updatedAt':
      return snapshots.updatedAt
    case 'createdAt':
    case 'id':
      return snapshots.id
    case 'diffPercentage':
    default:
      return snapshots.diffPercentage
  }
}

export async function listSnapshotsByBuild({
  buildId,
  page = 1,
  pageSize = 10,
  sortBy = '',
  sortDir = 'desc',
  search = '',
  approvalStatus = '',
}: {
  buildId: string
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
  search?: string
  approvalStatus?: string
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const filters = [eq(snapshots.buildId, buildId)] as SQL[]

  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    filters.push(ilike(snapshots.pagePath, `%${trimmedSearch}%`))
  }

  const trimmedApprovalStatus = approvalStatus?.trim() as SnapshotApprovalStatus
  if (trimmedApprovalStatus) {
    filters.push(eq(snapshots.approvalStatus, trimmedApprovalStatus))
  }

  const where = filters.length > 0 ? and(...filters) : undefined

  const baseRowsQuery = db
    .select({
      id: snapshots.id,
      pagePath: snapshots.pagePath,
      browser: snapshots.browser,
      diffPercentage: snapshots.diffPercentage,
      approvalStatus: snapshots.approvalStatus,
      screenshotMedia: {
        id: media.id,
        path: media.path,
        width: media.width,
        height: media.height,
        mimeType: media.mimeType,
      },
    })
    .from(snapshots)
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .orderBy(order)
    .limit(pageSize)
    .offset(offset)
  const baseCountQuery = db.select({ total: count() }).from(snapshots)

  const rowsQuery = where ? baseRowsQuery.where(where) : baseRowsQuery
  const countQuery = where ? baseCountQuery.where(where) : baseCountQuery

  const [rows, [{ total }]] = await Promise.all([rowsQuery, countQuery])

  return { data: rows, total }
}

export async function getSnapshotDetail({
  projectId,
  buildId,
  snapshotId,
}: {
  projectId: string
  buildId: string
  snapshotId: string
}) {
  const baselineMedia = alias(media, 'baseline_media')
  const diffMedia = alias(media, 'diff_media')

  const [build] = await db
    .select()
    .from(builds)
    .where(and(eq(builds.id, buildId), eq(builds.projectId, projectId)))
    .limit(1)

  if (!build) return null

  const [snapshot] = await db
    .select({
      id: snapshots.id,
      pagePath: snapshots.pagePath,
      diffPercentage: snapshots.diffPercentage,
      approvalStatus: snapshots.approvalStatus,
      screenshotMedia: {
        id: media.id,
        path: media.path,
        width: media.width,
        height: media.height,
        mimeType: media.mimeType,
      },
      baselineScreenshotMedia: {
        id: baselineMedia.id,
        path: baselineMedia.path,
        width: baselineMedia.width,
        height: baselineMedia.height,
        mimeType: baselineMedia.mimeType,
      },
      diffScreenshotMedia: {
        id: diffMedia.id,
        path: diffMedia.path,
        width: diffMedia.width,
        height: diffMedia.height,
        mimeType: diffMedia.mimeType,
      },
    })
    .from(snapshots)
    .where(and(eq(snapshots.id, snapshotId), eq(snapshots.buildId, buildId)))
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .leftJoin(baselineMedia, eq(snapshots.baselineScreenshotMediaId, baselineMedia.id))
    .leftJoin(diffMedia, eq(snapshots.diffScreenshotMediaId, diffMedia.id))

  if (!snapshot) return null

  return { build, snapshot }
}

export async function updateSnapshotApprovalStatus({
  snapshotId,
  status,
}: {
  snapshotId: string
  status: SnapshotApprovalStatus
}) {
  try {
    const isValidStatus = SnapshotApprovalStatus[status] ?? undefined
    if (!isValidStatus) {
      return { ok: false, error: 'Invalid approval status' } as const
    }

    await db.transaction(async (tx) => {
      const [snapshot] = await tx
        .update(snapshots)
        .set({ approvalStatus: status })
        .where(eq(snapshots.id, snapshotId))
        .returning()

      const [build] = await tx.select().from(builds).where(eq(builds.id, snapshot.buildId)).limit(1)

      // Update build status based on snapshot approvals
      const [{ totalRejected }] = await tx
        .select({ totalRejected: count() })
        .from(snapshots)
        .where(and(eq(snapshots.buildId, build.id), eq(snapshots.approvalStatus, SnapshotApprovalStatus.rejected)))

      const [{ total }] = await tx.select({ total: count() }).from(snapshots).where(eq(snapshots.buildId, build.id))

      if (totalRejected > 0) {
        build.status = BuildStatus.failed
      } else {
        const [{ totalApproved }] = await tx
          .select({ totalApproved: count() })
          .from(snapshots)
          .where(and(eq(snapshots.buildId, build.id), eq(snapshots.approvalStatus, SnapshotApprovalStatus.approved)))
        if (totalApproved === total) {
          build.status = BuildStatus.passed
        }
      }

      await tx.update(builds).set({ status: build.status }).where(eq(builds.id, build.id))

      // Find baseline build for the snapshot's build
      const [latestApprovedBuild] = await tx
        .select()
        .from(builds)
        .where(and(eq(builds.projectId, build.projectId), eq(builds.status, BuildStatus.passed)))
        .orderBy(desc(builds.createdAt))
        .limit(1)
      if (latestApprovedBuild) {
        await tx
          .update(projects)
          .set({ baselineBuildId: latestApprovedBuild.id })
          .where(eq(projects.id, build.projectId))
      }

      const pagePath = `/projects/${build.projectId}/builds/${build.id}/snapshots` as Route
      const actionLink = `${APP_URL}${pagePath}`

      if (build.status.toString() === BuildStatus.passed.toString()) {
        for (const subscribers of await getNovuSubscribers()) {
          await novu.trigger({
            workflowId: NOVU_WORKFLOW_BUILD_PASSED,
            to: subscribers,
            payload: {
              buildIdentifier: build.identifier,
              totalSnapshotCount: total,
              actionLink,
            },
          })
        }
      }

      if (build.status.toString() === BuildStatus.failed.toString()) {
        for (const subscribers of await getNovuSubscribers()) {
          await novu.trigger({
            workflowId: NOVU_WORKFLOW_BUILD_FAILED,
            to: subscribers,
            payload: {
              buildIdentifier: build.identifier,
              rejectedSnapshotCount: totalRejected,
              totalSnapshotCount: total,
              actionLink,
            },
          })
        }
      }
    })

    return { ok: true } as const
  } catch (error) {
    console.error(error)
    return { ok: false, error: 'Failed to update snapshot approval' } as const
  }
}

export async function getBaselineSnapshot({
  dbOrTx,
  baselineBuildId,
  payload,
}: {
  dbOrTx: DB | DBTransaction
  baselineBuildId: string
  payload: SnapshotPayload
}) {
  const [baselineSnapshot] = await dbOrTx
    .select({
      id: snapshots.id,
      screenshotMedia: {
        id: media.id,
        path: media.path,
        width: media.width,
        height: media.height,
        mimeType: media.mimeType,
      },
    })
    .from(snapshots)
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .where(
      and(
        eq(snapshots.buildId, baselineBuildId),
        eq(snapshots.pagePath, payload.pagePath),
        eq(snapshots.browser, payload.browser),
        eq(snapshots.viewportWidth, payload.viewportWidth),
        eq(snapshots.viewportHeight, payload.viewportHeight),
      ),
    )
    .orderBy(desc(snapshots.createdAt))
    .limit(1)

  return baselineSnapshot
}

export async function generateSnapshotFileName({
  pageUrl,
  type,
}: {
  pageUrl: string
  type: 'screenshot' | 'baseline-screenshot' | 'diff'
}) {
  return `${sha256Hex(pageUrl)}_${type}.png`
}

export async function generateSnapshotPath({
  projectId,
  buildId,
  snapshotId,
}: {
  projectId: string
  buildId: string
  snapshotId: string
}) {
  return `projects/${projectId}/builds/${buildId}/snapshots/${snapshotId}`
}

export type SnapshotsListRes = Awaited<ReturnType<typeof listSnapshotsByBuild>>
export type SnapshotListItemRes = SnapshotsListRes['data'][number]

export type GetSnapshotDetailRes = Awaited<ReturnType<typeof getSnapshotDetail>>
export type SnapshotDetailRes = NonNullable<GetSnapshotDetailRes>['snapshot']
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
