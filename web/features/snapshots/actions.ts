'use server'

import { and, count, asc, desc, eq, ilike, BinaryOperator } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import db from '@/db/drizzle'
import { media } from '@/db/schema/media'
import { builds, snapshots } from '@/db/schema/project'

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
}: {
  buildId: string
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
  search?: string
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const filters = [eq(snapshots.buildId, buildId)] as ReturnType<typeof ilike | BinaryOperator>[]

  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    filters.push(ilike(snapshots.pagePath, `%${trimmedSearch}%`))
  }

  const where = filters.length > 0 ? and(...filters) : undefined

  const baseRowsQuery = db
    .select({
      id: snapshots.id,
      pagePath: snapshots.pagePath,
      diffPercentage: snapshots.diffPercentage,
      approvalStatus: snapshots.approvalStatus,
      width: snapshots.width,
      height: snapshots.height,
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
      width: snapshots.width,
      height: snapshots.height,
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

export type SnapshotsListRes = Awaited<ReturnType<typeof listSnapshotsByBuild>>
export type SnapshotListItemRes = SnapshotsListRes['data'][number]

export type GetSnapshotDetailRes = Awaited<ReturnType<typeof getSnapshotDetail>>
export type SnapshotDetailRes = NonNullable<GetSnapshotDetailRes>['snapshot']
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
