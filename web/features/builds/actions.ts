'use server'

import { type Subscriber } from '@novu/js'
import { and, asc, count, desc, eq, like, type SQL } from 'drizzle-orm'
import { type Route } from 'next'
import { NextResponse } from 'next/server'
import { v7 as uuidv7 } from 'uuid'

import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_CREATED, NOVU_WORKFLOW_BUILD_FAILED, NOVU_WORKFLOW_BUILD_PASSED } from '@/constants/novu'
import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import { TEMPORAL_BUILD_SNAPSHOTS_WORKFLOW, TEMPORAL_QUEUE_NAME } from '@/constants/temporal'
import db, { type DB, type DBTransaction } from '@/db/drizzle'
import { snapshots, users } from '@/db/schema'
import { builds, pageRules, projects } from '@/db/schema'
import { SpotteurGlobalVariablesSchema } from '@/features/page-rules/schema'
import { generateSnapshotFileName, generateSnapshotPath } from '@/features/snapshots/actions'
import { logger } from '@/lib/logger'
import novu from '@/lib/novu'
import { temporalClient } from '@/lib/temporal-client'
import { humanReadableEpoch } from '@/lib/utils'
import { type buildSnapshotsWorkflow } from '@/temporal/workflows/snapshot'
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

export async function startBuildWorkflow({ projectId, buildId }: { projectId: string; buildId: string }) {
  await temporalClient.workflow.start<typeof buildSnapshotsWorkflow>(TEMPORAL_BUILD_SNAPSHOTS_WORKFLOW, {
    workflowId: `build-${buildId}`,
    taskQueue: TEMPORAL_QUEUE_NAME,
    args: [{ projectId, buildId }],
    retry: {
      maximumAttempts: 3,
    },
  })
}

export async function triggerBuild({ projectId, identifier }: { projectId: string; identifier?: string }) {
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)

  if (!project) {
    return { ok: false, error: 'Project not found' } as const
  }

  const [pendingBuild] = await db
    .select({ id: builds.id })
    .from(builds)
    .where(and(eq(builds.projectId, projectId), eq(builds.status, BuildStatus.PENDING)))
    .limit(1)

  if (pendingBuild) {
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
      status: BuildStatus.PENDING,
      identifier: buildIdentifier,
      baselineBuildId: project.baselineBuildId,
    })
    .returning()

  await startBuildWorkflow({ projectId, buildId: build.id })

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

export async function resumeBuild({ projectId, buildId }: { projectId: string; buildId: string }) {
  try {
    const [build] = await db
      .select()
      .from(builds)
      .where(and(eq(builds.id, buildId), eq(builds.projectId, projectId)))
      .limit(1)
    if (!build) {
      return { ok: false, error: 'Build not found' } as const
    }

    if (build.status !== BuildStatus.ERROR) {
      return { ok: false, error: 'Build is not in error state' } as const
    }

    await startBuildWorkflow({ projectId, buildId })

    return { ok: true } as const
  } catch (error) {
    logger.error(error)
    await db.update(builds).set({ status: BuildStatus.ERROR }).where(eq(builds.id, buildId))
    return { ok: false, error: 'Failed to resume build' } as const
  }
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

  const pageRuleRows = await db.select().from(pageRules).where(eq(pageRules.projectId, project.id))
  const pageRulesMap = new Map<string, typeof pageRules.$inferSelect>()
  for (const pr of pageRuleRows) {
    pageRulesMap.set(pr.pagePath, pr)
  }

  const existingSnapshotRows = await db.select().from(snapshots).where(eq(snapshots.buildId, build.id))

  const snapshotsArray: SnapshotPayload[] = []
  for (const pagePath of project.pagePaths) {
    if (!URL.canParse(pagePath, project.baseUrl)) {
      throw new Error(`Invalid URL given for path: ${pagePath} with base URL ${project.baseUrl}`)
    }

    const projectId = build.projectId
    const buildId = build.id
    const pageUrl = new URL(pagePath, build.baseUrl).toString()

    const pageRule = pageRulesMap.get(pagePath)

    const viewports = pageRule?.viewports ?? project.viewports

    const browsers = pageRule?.snapshotBrowsers ?? project.snapshotBrowsers

    for (const [viewportWidth, viewportHeight] of viewports) {
      for (const browser of browsers) {
        const existingSnapshot = existingSnapshotRows.find((s) => {
          if (
            s.pagePath === pagePath &&
            s.browser === browser &&
            s.viewportWidth === viewportWidth &&
            s.viewportHeight === viewportHeight
          ) {
            return true
          }
          return false
        })
        const snapshotId = existingSnapshot ? existingSnapshot.id : uuidv7()
        const s3Prefix = await generateSnapshotPath({ projectId, buildId, snapshotId })
        const fileName = await generateSnapshotFileName({ pageUrl, type: 'screenshot' })

        snapshotsArray.push({
          id: snapshotId,
          projectId,
          buildId,
          pagePath,
          pageUrl,
          browser,
          viewportWidth,
          viewportHeight,
          selector: project.snapshotSelector,
          s3Prefix,
          fileName,
          reducedMotion: pageRule?.reducedMotion || false,
          mediaReset: pageRule?.mediaReset || false,
          rules: pageRule?.rules,
          hooks: {
            'after-page-load': pageRule?.hookAfterPageLoad ?? undefined,
            'before-screenshot': pageRule?.hookBeforeScreenshot ?? undefined,
          },
        } satisfies SnapshotPayload)
      }
    }
  }

  return snapshotsArray
}

export async function syncBuildStatusBasedOnSnapshotApprovals({
  dbOrTx,
  build,
}: {
  dbOrTx: DB | DBTransaction
  build: typeof builds.$inferSelect
}) {
  const initialBuildStatus = build.status

  // Update build status based on snapshot approvals
  const [{ totalRejected }] = await dbOrTx
    .select({ totalRejected: count() })
    .from(snapshots)
    .where(and(eq(snapshots.buildId, build.id), eq(snapshots.approvalStatus, SnapshotApprovalStatus.REJECTED)))

  const [{ total }] = await dbOrTx.select({ total: count() }).from(snapshots).where(eq(snapshots.buildId, build.id))

  if (build.status === BuildStatus.WAITING_REVIEW && totalRejected > 0) {
    build.status = BuildStatus.FAILED
  } else {
    const [{ totalApproved }] = await dbOrTx
      .select({ totalApproved: count() })
      .from(snapshots)
      .where(and(eq(snapshots.buildId, build.id), eq(snapshots.approvalStatus, SnapshotApprovalStatus.APPROVED)))
    if (build.status === BuildStatus.WAITING_REVIEW && totalApproved === total) {
      build.status = BuildStatus.PASSED
    }
  }

  await dbOrTx.update(builds).set({ status: build.status }).where(eq(builds.id, build.id))

  // Find baseline build for the snapshot's build
  const [latestApprovedBuild] = await dbOrTx
    .select()
    .from(builds)
    .where(and(eq(builds.projectId, build.projectId), eq(builds.status, BuildStatus.PASSED)))
    .orderBy(desc(builds.createdAt))
    .limit(1)
  if (latestApprovedBuild) {
    await dbOrTx
      .update(projects)
      .set({ baselineBuildId: latestApprovedBuild.id })
      .where(eq(projects.id, build.projectId))
  }

  const pagePath = `/projects/${build.projectId}/builds/${build.id}/snapshots` as Route
  const actionLink = `${APP_URL}${pagePath}`

  if (
    initialBuildStatus.toString() === BuildStatus.WAITING_REVIEW.toString() &&
    build.status.toString() === BuildStatus.PASSED.toString()
  ) {
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

  if (
    initialBuildStatus.toString() === BuildStatus.WAITING_REVIEW.toString() &&
    build.status.toString() === BuildStatus.FAILED.toString()
  ) {
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
}

export async function mergeGlobalVariablesIntoSnapshotPayload({
  payload,
  rawVariables,
}: {
  payload: SnapshotPayload
  rawVariables: unknown
}): Promise<SnapshotPayload> {
  const { success, data: spotteurGlobalVar } = SpotteurGlobalVariablesSchema.safeParse(rawVariables)
  if (!success) {
    return payload
  }

  payload.reducedMotion = spotteurGlobalVar.options?.reducedMotion || payload.reducedMotion || false
  payload.mediaReset = spotteurGlobalVar.options?.mediaReset || payload.mediaReset || false
  payload.rules = spotteurGlobalVar.options?.rules || payload.rules || undefined
  payload.hooks = spotteurGlobalVar.hooks || payload.hooks || undefined

  return payload
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
