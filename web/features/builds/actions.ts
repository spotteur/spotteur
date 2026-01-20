'use server'

import { type Subscriber } from '@novu/js'
import { and, asc, count, desc, eq, like, type SQL } from 'drizzle-orm'
import { type Route } from 'next'
import { NextResponse } from 'next/server'
import { v7 as uuidv7 } from 'uuid'

import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_CREATED } from '@/constants/novu'
import { BuildStatus } from '@/constants/status-map'
import { TEMPORAL_BUILD_SNAPSHOTS_WORKFLOW, TEMPORAL_QUEUE_NAME } from '@/constants/temporal'
import db from '@/db/drizzle'
import { users } from '@/db/schema'
import { builds, projects } from '@/db/schema/project'
import novu from '@/lib/novu'
import { temporalClient } from '@/lib/temporal-client'
import { humanReadableEpoch } from '@/lib/utils'
import { type SnapshotPayload } from '@/types/screenshot'

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

export async function getNovuSubscribers() {
  const userRows = await db.select({ id: users.id, email: users.email }).from(users)
  const chunkedSubscribers: Subscriber[][] = []
  for (let i = 0; i < userRows.length; i += 100) {
    chunkedSubscribers.push(
      userRows.slice(i, i + 100).map((s) => ({
        subscriberId: s.id,
        email: s.email,
      })),
    )
  }
  return chunkedSubscribers
}

export async function triggerBuild({ projectId, identifier }: { projectId: string; identifier?: string }) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)

  if (!project) {
    return { ok: false, error: 'Project not found' } as const
  }

  const [pendingBuilds] = await db
    .select()
    .from(builds)
    .where(and(eq(builds.projectId, projectId), eq(builds.status, BuildStatus.pending)))
    .limit(1)

  if (pendingBuilds) {
    return { ok: false, error: 'Pending build still exists!' } as const
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

  await temporalClient.workflow.start(TEMPORAL_BUILD_SNAPSHOTS_WORKFLOW, {
    workflowId: `build-${build.id}`,
    taskQueue: TEMPORAL_QUEUE_NAME,
    args: [{ projectId: project.id, buildId: build.id }],
  })

  const pagePath = `/projects/${projectId}/builds/${build.id}/snapshots` as Route

  for (const subscribers of await getNovuSubscribers()) {
    await novu.trigger({
      workflowId: NOVU_WORKFLOW_BUILD_CREATED,
      to: subscribers,
      payload: {
        buildIdentifier: build.identifier,
        projectName: project.name,
        actionLink: `${APP_URL}${pagePath}`,
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

export async function populateSnapshotsPayload({
  build,
  project,
}: {
  build: typeof builds.$inferSelect
  project: typeof projects.$inferSelect
}) {
  if (!project.pagePaths.length) {
    throw new Error(`This project doesn't have any page paths configured`)
  }

  if (!project.snapshotBrowsers.length) {
    throw new Error(`This project doesn't have any snapshot browsers configured`)
  }

  if (!project.viewports.length) {
    throw new Error(`This project doesn't have any viewports configured`)
  }

  // TODO: Get page rules configurations

  const snapshotsArray: SnapshotPayload[] = []
  for (const pagePath of project.pagePaths) {
    if (!URL.canParse(pagePath, project.baseUrl)) {
      throw new Error(`Invalid URL given for path: ${pagePath} with base URL ${project.baseUrl}`)
    }

    const viewports = project.viewports
    // TODO: Apply page rules to override viewports if any

    const browsers = project.snapshotBrowsers
    // TODO: Apply page rules to override browsers if any

    for (const viewport of viewports) {
      for (const browser of browsers) {
        snapshotsArray.push({
          id: uuidv7(),
          buildId: build.id,
          pagePath,
          pageUrl: new URL(pagePath, build.baseUrl).toString(),
          browser,
          viewportWidth: viewport[0],
          viewportHeight: viewport[1],
          selector: project.snapshotSelector,
        } satisfies SnapshotPayload)
      }
    }
  }

  return snapshotsArray
}

export async function triggerBuildApi({
  projectId,
  identifier,
  token,
}: {
  projectId: string
  identifier: string
  token: string
}) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.token, token)))
    .limit(1)

  if (!project) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Invalid project id or token',
      },
      { status: 400 },
    )
  }

  const build = await triggerBuild({ projectId, identifier })
  if (!build.ok) {
    return NextResponse.json(build, { status: 401 })
  }
  return NextResponse.json(build, { status: 201 })
}
