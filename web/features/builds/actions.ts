'use server'

import { and, asc, count, desc, eq } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'

import db from '@/db/drizzle'
import { media } from '@/db/schema/media'
import { builds, projects, snapshots } from '@/db/schema/project'
import { humanReadableEpoch } from '@/lib/utils'

type SortKey = 'identifier' | 'status' | 'createdAt' | 'updatedAt' | ''

const sortColumn = (key: SortKey) => {
  switch (key) {
    case 'identifier':
      return builds.identifier
    case 'status':
      return builds.status
    case 'updatedAt':
      return builds.updatedAt
    case 'createdAt':
    default:
      return builds.createdAt
  }
}

export async function listBuildsByProject({
  projectId,
  page = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortDir = 'desc',
}: {
  projectId: string
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const rowsQuery = db
    .select()
    .from(builds)
    .where(eq(builds.projectId, projectId))
    .orderBy(order)
    .limit(pageSize)
    .offset(offset)

  const countQuery = db.select({ total: count() }).from(builds).where(eq(builds.projectId, projectId))

  const [rows, [{ total }]] = await Promise.all([rowsQuery, countQuery])

  return { data: rows, total }
}

export async function triggerBuild(projectId: string, identifier?: string) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)

  if (!project) {
    return { ok: false, error: 'Project not found' } as const
  }

  const safeIdentifier = identifier?.trim()
  const buildIdentifier =
    safeIdentifier && safeIdentifier.length > 0 ? safeIdentifier : `manual-${humanReadableEpoch()}`

  const [created] = await db
    .insert(builds)
    .values({
      projectId: project.id,
      baseUrl: project.baseUrl,
      pagePaths: project.pagePaths,
      status: 'pending',
      identifier: buildIdentifier,
    })
    .returning()

  // TODO: Put task to temporal

  return { ok: true, data: created } as const
}

export async function getBuildDetail({ projectId, buildId }: { projectId: string; buildId: string }) {
  const [build] = await db
    .select()
    .from(builds)
    .where(and(eq(builds.id, buildId), eq(builds.projectId, projectId)))
    .limit(1)

  if (!build) return null

  const snapshotRows = await db
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
    .where(eq(snapshots.buildId, buildId))
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))

  return { build, snapshots: snapshotRows }
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
