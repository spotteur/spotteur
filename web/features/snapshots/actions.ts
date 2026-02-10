'use server'

import { and, count, asc, desc, eq, ilike, type SQL, lt, gt } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import { SnapshotApprovalStatus } from '@/constants/status-map'
import db, { type DB, type DBTransaction } from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { syncBuildStatusBasedOnSnapshotApprovals } from '@/features/builds/actions'
import { logger } from '@/lib/logger'
import { getPresignUrl } from '@/lib/s3'
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
  const orders: SQL[] = []
  const order = sortDir === 'asc' ? asc(column) : desc(column)
  orders.push(order)
  orders.push(desc(snapshots.id))

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
      viewportWidth: snapshots.viewportWidth,
      viewportHeight: snapshots.viewportHeight,
      diffPercentage: snapshots.diffPercentage,
      approvalStatus: snapshots.approvalStatus,
      screenshotMedia: {
        id: media.id,
        path: media.path,
        width: media.width,
        height: media.height,
        mimeType: media.mimeType,
      },
      createdAt: snapshots.createdAt,
    })
    .from(snapshots)
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .orderBy(...orders)
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

  const action: { prev: string; next: string } = {
    prev: await getPrevSnapshot({ buildId: buildId, snapshotId: snapshot.id }),
    next: await getNextSnapshot({ buildId: buildId, snapshotId: snapshot.id }),
  }

  return { build, snapshot, action }
}

export async function updateSnapshotApprovalStatus({
  snapshotId,
  status,
}: {
  snapshotId: string
  status: SnapshotApprovalStatus
}) {
  try {
    const isValidStatus = Object.values(SnapshotApprovalStatus).includes(status)
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

      await syncBuildStatusBasedOnSnapshotApprovals({ dbOrTx: tx, build })
    })

    return { ok: true } as const
  } catch (error) {
    logger.error(error)
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

export async function getPrevSnapshot({ buildId, snapshotId }: { buildId: string; snapshotId: string }) {
  const [prev] = await db
    .select({ id: snapshots.id })
    .from(snapshots)
    .where(and(eq(snapshots.buildId, buildId), gt(snapshots.id, snapshotId)))
    .orderBy(asc(snapshots.id))
    .limit(1)

  if (!prev) return ''
  return prev.id
}

export async function getNextSnapshot({ buildId, snapshotId }: { buildId: string; snapshotId: string }) {
  const [next] = await db
    .select({ id: snapshots.id })
    .from(snapshots)
    .where(and(eq(snapshots.buildId, buildId), lt(snapshots.id, snapshotId)))
    .orderBy(desc(snapshots.id))
    .limit(1)

  if (!next) return ''
  return next.id
}

export type SnapshotsListRes = Awaited<ReturnType<typeof listSnapshotsByBuild>>
export type SnapshotListItemRes = SnapshotsListRes['data'][number]

export type GetSnapshotDetailRes = Awaited<ReturnType<typeof getSnapshotDetail>>
export type SnapshotDetailRes = NonNullable<GetSnapshotDetailRes>['snapshot']
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
export type SnapshotActionRes = { prev: string; next: string }
