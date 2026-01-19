'use server'

import { and, count, asc, desc, eq, ilike, type SQL } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, projects, snapshots } from '@/db/schema'
import { getPresignUrl } from '@/lib/s3'

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

  const modifiedRows = rows.map(async (row) => {
    if (row.screenshotMedia) {
      const path = await getPresignUrl({ key: row.screenshotMedia.path })
      return { ...row, screenshotMedia: { ...row.screenshotMedia, path } }
    }
    return row
  })

  return { data: await Promise.all(modifiedRows), total }
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

  if (snapshot.screenshotMedia) {
    const path = await getPresignUrl({ key: snapshot.screenshotMedia.path })
    snapshot.screenshotMedia = { ...snapshot.screenshotMedia, path }
  }

  if (snapshot.baselineScreenshotMedia) {
    const path = await getPresignUrl({ key: snapshot.baselineScreenshotMedia.path })
    snapshot.baselineScreenshotMedia = { ...snapshot.baselineScreenshotMedia, path }
  }

  if (snapshot.diffScreenshotMedia) {
    const path = await getPresignUrl({ key: snapshot.diffScreenshotMedia.path })
    snapshot.diffScreenshotMedia = { ...snapshot.diffScreenshotMedia, path }
  }

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

      // Update build status based on snapshot approvals
      const [{ total: totalRejected }] = await tx
        .select({ total: count() })
        .from(snapshots)
        .where(
          and(eq(snapshots.buildId, snapshot.buildId), eq(snapshots.approvalStatus, SnapshotApprovalStatus.rejected)),
        )

      let buildStatus = BuildStatus.waiting_review
      if (totalRejected > 0) {
        buildStatus = BuildStatus.failed
      } else {
        const [{ total }] = await tx
          .select({ total: count() })
          .from(snapshots)
          .where(eq(snapshots.buildId, snapshot.buildId))
        const [{ total: totalApproved }] = await tx
          .select({ total: count() })
          .from(snapshots)
          .where(
            and(eq(snapshots.buildId, snapshot.buildId), eq(snapshots.approvalStatus, SnapshotApprovalStatus.approved)),
          )
        if (totalApproved === total) {
          buildStatus = BuildStatus.passed
        }
      }

      await tx.update(builds).set({ status: buildStatus }).where(eq(builds.id, snapshot.buildId))

      // Find baseline build for the snapshot's build
      const [latestApprovedBuild] = await tx
        .select()
        .from(builds)
        .where(and(eq(builds.projectId, snapshot.buildId), eq(builds.status, BuildStatus.passed)))
        .orderBy(desc(builds.createdAt))
        .limit(1)
      if (latestApprovedBuild) {
        await tx.update(projects).set({ baselineBuildId: latestApprovedBuild.id }).where(eq(snapshots.id, snapshotId))
      }
    })

    return { ok: true } as const
  } catch (error) {
    console.error(error)
    return { ok: false, error: 'Failed to update snapshot approval' } as const
  }
}

export type SnapshotsListRes = Awaited<ReturnType<typeof listSnapshotsByBuild>>
export type SnapshotListItemRes = SnapshotsListRes['data'][number]

export type GetSnapshotDetailRes = Awaited<ReturnType<typeof getSnapshotDetail>>
export type SnapshotDetailRes = NonNullable<GetSnapshotDetailRes>['snapshot']
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
