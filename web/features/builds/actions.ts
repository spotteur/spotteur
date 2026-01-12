'use server'

import { and, asc, count, desc, eq, like, type SQL } from 'drizzle-orm'
import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_CREATED } from '@/constants/novu'
import { BuildStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { builds, projects } from '@/db/schema/project'
import novu from '@/lib/novu'
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
  search = '',
}: {
  projectId: string
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
  search?: string
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const filters = [eq(builds.projectId, projectId)] as SQL[]
  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    filters.push(like(builds.identifier, `${trimmedSearch}%`))
  }

  const where = filters.length > 0 ? and(...filters) : undefined

  const rowsQuery = db.select().from(builds).where(where).orderBy(order).limit(pageSize).offset(offset)

  const countQuery = db.select({ total: count() }).from(builds).where(where)

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

  const [build] = await db
    .insert(builds)
    .values({
      projectId: project.id,
      baseUrl: project.baseUrl,
      pagePaths: project.pagePaths,
      status: BuildStatus.pending,
      identifier: buildIdentifier,
      baselineBuildId: project.baselineBuildId,
    })
    .returning()

  // TODO: Put task to temporal

  const pagePath = `/projects/${projectId}/builds/${build.id}/snapshots` as Route

  const subscribers = await db.select({ id: users.id }).from(users)
  const chunkedSubscribers = []
  for (let i = 0; i < subscribers.length; i += 100) {
    chunkedSubscribers.push(subscribers.slice(i, i + 100))
  }

  for (const chunk of chunkedSubscribers) {
    novu.trigger({
      workflowId: NOVU_WORKFLOW_BUILD_CREATED,
      to: chunk.map((s) => s.id),
      payload: {
        buildIdentifier: build.identifier,
        projectName: project.name,
        actionUrl: `${APP_URL}${pagePath}`,
      },
    })
  }

  return { ok: true, data: build } as const
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
