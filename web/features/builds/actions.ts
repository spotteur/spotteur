'use server'

import { and, asc, count, desc, eq } from 'drizzle-orm'

import { BuildStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, projects } from '@/db/schema/project'
import { humanReadableEpoch } from '@/lib/utils'

type SortKey = 'createdAt' | 'updatedAt' | ''

const sortColumn = (key: SortKey) => {
  switch (key) {
    case 'updatedAt':
      return builds.updatedAt
    case 'createdAt':
    default:
      return builds.id
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

export async function triggerBuild({ projectId, identifier }: { projectId: string; identifier?: string }) {
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
      status: BuildStatus.pending,
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

  return build
}
