'use server'

import { and, asc, desc, eq, lt, gt, inArray } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import { z } from 'zod'

import { DEFAULT_ERROR_MESSAGE, DEFAULT_SNAPSHOTS_SELECTOR } from '@/constants/app'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import { TEMPORAL_QUEUE_NAME, TEMPORAL_RETRY_SINGLE_SNAPSHOT_WORKFLOW } from '@/constants/temporal'
import db, { type DB, type DBTransaction } from '@/db/drizzle'
import { builds, media, projects, snapshots } from '@/db/schema'
import { syncBuildStatusBasedOnSnapshotApprovals } from '@/features/builds/actions'
import { pageRuleByPath } from '@/features/page-rules/actions'
import { UpdateSnapshotNotesSchema } from '@/features/snapshots/schema'
import { logger } from '@/lib/logger'
import { getPresignUrl } from '@/lib/s3'
import { temporalClient } from '@/lib/temporal-client'
import { sha256Hex } from '@/lib/utils'
import { type retrySingleSnapshotWorkflow } from '@/temporal/workflows/snapshot'
import { type SnapshotPayload } from '@/types/screenshot'

export async function listSnapshotsByBuildV2({ buildId }: { buildId: string }) {
  const baselineMedia = alias(media, 'baseline_media')
  const diffMedia = alias(media, 'diff_media')
  const rows = await db
    .select({
      id: snapshots.id,
      buildId: snapshots.buildId,
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
    .orderBy(asc(snapshots.pagePath), asc(snapshots.browser), asc(snapshots.viewportWidth))

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

export async function getSnapshotDetail({ snapshotId }: { snapshotId: string }) {
  const baselineMedia = alias(media, 'baseline_media')
  const diffMedia = alias(media, 'diff_media')

  const [snapshot] = await db
    .select({
      id: snapshots.id,
      buildId: snapshots.buildId,
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
    .where(eq(snapshots.id, snapshotId))
    .leftJoin(media, eq(snapshots.screenshotMediaId, media.id))
    .leftJoin(baselineMedia, eq(snapshots.baselineScreenshotMediaId, baselineMedia.id))
    .leftJoin(diffMedia, eq(snapshots.diffScreenshotMediaId, diffMedia.id))

  if (!snapshot) return null

  const [build] = await db.select().from(builds).where(eq(builds.id, snapshot.buildId)).limit(1)

  if (!build) return null

  const [project] = await db.select().from(projects).where(eq(projects.id, build.projectId)).limit(1)

  const [screenshotUrl, baselineUrl, diffUrl, prev, next] = await Promise.all([
    snapshot.screenshotMedia ? getPresignUrl({ key: snapshot.screenshotMedia.path }) : Promise.resolve(''),
    snapshot.baselineScreenshotMedia
      ? getPresignUrl({ key: snapshot.baselineScreenshotMedia.path })
      : Promise.resolve(''),
    snapshot.diffScreenshotMedia ? getPresignUrl({ key: snapshot.diffScreenshotMedia.path }) : Promise.resolve(''),
    getPrevSnapshot({ buildId: build.id, snapshotId: snapshot.id }),
    getNextSnapshot({ buildId: build.id, snapshotId: snapshot.id }),
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

  return { build, snapshot, action, project }
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

export async function bulkUpdateSnapshotApprovalStatus({
  snapshotIds,
  status,
}: {
  snapshotIds: string[]
  status: SnapshotApprovalStatus
}) {
  try {
    const isValidStatus = Object.values([SnapshotApprovalStatus.APPROVED, SnapshotApprovalStatus.REJECTED]).includes(
      status,
    )
    if (!isValidStatus) {
      return { ok: false, error: 'Invalid approval status' } as const
    }
    await db.transaction(async (tx) => {
      const [snapshot] = await tx
        .update(snapshots)
        .set({ approvalStatus: status })
        .where(inArray(snapshots.id, snapshotIds))
        .returning()

      const [build] = await tx.select().from(builds).where(eq(builds.id, snapshot.buildId))

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

export async function retrySingleSnapshot({
  projectId,
  buildId,
  snapshotId,
}: {
  projectId: string
  buildId: string
  snapshotId: string
}) {
  const date = new Date()
  await temporalClient.workflow.start<typeof retrySingleSnapshotWorkflow>(TEMPORAL_RETRY_SINGLE_SNAPSHOT_WORKFLOW, {
    workflowId: `build-${buildId}-snapshot-${snapshotId}-retry-${date.getTime()}`,
    taskQueue: TEMPORAL_QUEUE_NAME,
    args: [{ projectId, buildId, snapshotId }],
    retry: {
      maximumAttempts: 3,
    },
  })

  return { ok: true } as const
}

export async function populateSingleSnapshotPayload({
  snapshotId,
  projectId,
}: {
  snapshotId: string
  projectId: string
}) {
  const [data] = await db
    .select()
    .from(snapshots)
    .innerJoin(builds, eq(snapshots.buildId, builds.id))
    .where(eq(snapshots.id, snapshotId))
    .limit(1)

  const snapshot = data.snapshots
  const build = data.builds
  const pageRule = await pageRuleByPath({ projectId, path: snapshot.pagePath })
  const project = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1)
    .then((res) => res[0])

  if (!project) {
    throw new Error(`Project not found for ID: ${projectId}`)
  }

  if (!URL.canParse(snapshot.pagePath, project.baseUrl)) {
    throw new Error(`Invalid URL given for path: ${snapshot.pagePath} with base URL ${project.baseUrl}`)
  }

  const buildId = snapshot.buildId
  const pageUrl = new URL(snapshot.pagePath, project.baseUrl).toString()

  const { viewportWidth, viewportHeight } = snapshot

  const browser = snapshot.browser
  const s3Prefix = await generateSnapshotPath({ projectId, buildId, snapshotId: snapshotId.toString() })
  const fileName = await generateSnapshotFileName({ pageUrl, type: 'screenshot' })

  const snapshotPayload: SnapshotPayload = {
    id: snapshotId,
    projectId,
    buildId,
    baselineBuildId: build.baselineBuildId,
    diffTolerancePercentage: build.diffTolerancePercentage,
    pagePath: snapshot.pagePath,
    pageUrl,
    browser,
    viewportWidth,
    viewportHeight,
    selector: DEFAULT_SNAPSHOTS_SELECTOR,
    s3Prefix,
    fileName,
    reducedMotion: pageRule?.reducedMotion || false,
    mediaReset: pageRule?.mediaReset || false,
    proxy: pageRule?.proxy ?? undefined,
    rules: pageRule?.rules,
    hooks: {
      'after-page-load': pageRule?.hookAfterPageLoad ?? undefined,
      'before-screenshot': pageRule?.hookBeforeScreenshot ?? undefined,
    },
    globalHooks: {
      'after-page-load': project?.hookAfterPageLoad ?? undefined,
      'before-screenshot': project?.hookBeforeScreenshot ?? undefined,
    },
  }

  return snapshotPayload
}

export type SnapshotsListV2Res = Awaited<ReturnType<typeof listSnapshotsByBuildV2>>
export type SnapshotDetailRes = SnapshotsListV2Res['data'][number]
export type MediaDetailRes = NonNullable<SnapshotDetailRes['screenshotMedia']>
