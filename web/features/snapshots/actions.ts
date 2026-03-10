'use server'

import { and, count, asc, desc, eq, ilike, type SQL, lt, gt } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

import { DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import db, { type DB, type DBTransaction } from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { syncBuildStatusBasedOnSnapshotApprovals } from '@/features/builds/actions'
import { UpdateSnapshotNotesSchema } from '@/features/snapshots/schema'
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

export async function listSnapshotsByBuildV2({ buildId }: { buildId: string }) {
  const baselineMedia = alias(media, 'baseline_media')
  const diffMedia = alias(media, 'diff_media')
  const rows = await db
    .select({
      id: snapshots.id,
      pagePath: snapshots.pagePath,
      browser: snapshots.browser,
      diffPercentage: snapshots.diffPercentage,
      approvalStatus: snapshots.approvalStatus,
      notes: snapshots.notes,
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
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .leftJoin(baselineMedia, eq(snapshots.baselineScreenshotMediaId, baselineMedia.id))
    .leftJoin(diffMedia, eq(snapshots.diffScreenshotMediaId, diffMedia.id))
    .where(eq(snapshots.buildId, buildId))
    .orderBy(asc(snapshots.pagePath), asc(snapshots.browser))

  const modifiedRows = rows.map(async (row) => {
    const [screenshotUrl, baselineUrl, diffUrl] = await Promise.all([
      row.screenshotMedia ? getPresignUrl({ key: row.screenshotMedia.path }) : Promise.resolve(''),
      row.baselineScreenshotMedia ? getPresignUrl({ key: row.baselineScreenshotMedia.path }) : Promise.resolve(''),
      row.diffScreenshotMedia ? getPresignUrl({ key: row.diffScreenshotMedia.path }) : Promise.resolve(''),
    ])

    return {
      ...row,
      screenshotMedia: row.screenshotMedia ? { ...row.screenshotMedia, path: screenshotUrl } : row.screenshotMedia,
      baselineScreenshotMedia: row.baselineScreenshotMedia
        ? { ...row.baselineScreenshotMedia, path: baselineUrl }
        : row.baselineScreenshotMedia,
      diffScreenshotMedia: row.diffScreenshotMedia
        ? { ...row.diffScreenshotMedia, path: diffUrl }
        : row.diffScreenshotMedia,
    }
  })

  return { data: await Promise.all(modifiedRows) }
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
      notes: snapshots.notes,
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
      notes: snapshots.notes,
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

  const [screenshotUrl, baselineUrl, diffUrl, prev, next] = await Promise.all([
    snapshot.screenshotMedia ? getPresignUrl({ key: snapshot.screenshotMedia.path }) : Promise.resolve(''),
    snapshot.baselineScreenshotMedia
      ? getPresignUrl({ key: snapshot.baselineScreenshotMedia.path })
      : Promise.resolve(''),
    snapshot.diffScreenshotMedia ? getPresignUrl({ key: snapshot.diffScreenshotMedia.path }) : Promise.resolve(''),
    getPrevSnapshot({ buildId: buildId, snapshotId: snapshot.id }),
    getNextSnapshot({ buildId: buildId, snapshotId: snapshot.id }),
  ])

  if (snapshot.screenshotMedia) {
    snapshot.screenshotMedia = { ...snapshot.screenshotMedia, path: screenshotUrl }
  }

  if (snapshot.baselineScreenshotMedia) {
    snapshot.baselineScreenshotMedia = { ...snapshot.baselineScreenshotMedia, path: baselineUrl }
  }

  if (snapshot.diffScreenshotMedia) {
    snapshot.diffScreenshotMedia = { ...snapshot.diffScreenshotMedia, path: diffUrl }
  }

  const action = { prev, next }

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
    return { ok: false, error: DEFAULT_ERROR_MESSAGE } as const
  }
}

export async function updateSnapshotNotes({ snapshotId, payload }: { snapshotId: string; payload: unknown }) {
  try {
    const parseResult = UpdateSnapshotNotesSchema.safeParse(payload)
    if (!parseResult.success) {
      return {
        ok: false,
        error: z.prettifyError(parseResult.error),
        errors: z.flattenError(parseResult.error),
      } as const
    }

    const { notes } = parseResult.data

    await db
      .update(snapshots)
      .set({
        notes: notes ?? null,
      })
      .where(eq(snapshots.id, snapshotId))

    return { ok: true } as const
  } catch (error) {
    logger.error(error)
    return { ok: false, error: DEFAULT_ERROR_MESSAGE } as const
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

export type SnapshotsListV2Res = Awaited<ReturnType<typeof listSnapshotsByBuildV2>>
export type SnapshotListV2ItemRes = SnapshotsListV2Res['data'][number]

export type GetSnapshotDetailRes = Awaited<ReturnType<typeof getSnapshotDetail>>
export type SnapshotDetailRes = NonNullable<GetSnapshotDetailRes>['snapshot'] | SnapshotListV2ItemRes
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
export type SnapshotActionRes = { prev: string; next: string }
