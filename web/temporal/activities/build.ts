import * as fs from 'node:fs'

import { Context } from '@temporalio/activity'
import { ApplicationFailure, CancelledFailure } from '@temporalio/common'
import { and, eq } from 'drizzle-orm'
import { type Route } from 'next'

import { APP_URL, BROWSER_ENGINE_TYPE } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW } from '@/constants/novu'
import { BuildStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, snapshots } from '@/db/schema'
import { getNovuSubscribers, syncBuildStatusBasedOnSnapshotApprovals } from '@/features/builds/actions'
import {
  BrowserEngineFactory,
  BrowserEngineType,
  UnsupportedBrowserEngineError,
  UnsupportedBrowserTypeError,
} from '@/lib/browser-engine'
import { logger } from '@/lib/logger'
import novu from '@/lib/novu'
import { ScreenshotCapturer } from '@/lib/screenshot/capturer'
import { ScreenshotProcessor } from '@/lib/screenshot/processor'
import { isSnapshotExactlyMatching } from '@/lib/utils'
import { type IBrowserEngine } from '@/types/browser-engine'
import {
  type ProcessScreenshotResult,
  type ProcessScreenshotParams,
  type CaptureScreenshotParams,
  type CaptureScreenshotResult,
} from '@/types/screenshot'

export async function markBuildAsStarted({ buildId }: { buildId: string }) {
  try {
    const [build] = await db.select().from(builds).where(eq(builds.id, buildId)).limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found`)
    }

    await db.update(builds).set({ status: BuildStatus.IN_PROGRESS }).where(eq(builds.id, buildId))
  } catch (error) {
    if (error instanceof ApplicationFailure) {
      throw error
    }

    logger.error(error)
    throw ApplicationFailure.retryable(
      `Failed to mark build as started: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}

export async function getExistingSnapshot({
  snapshotId,
}: {
  snapshotId: string
}): Promise<typeof snapshots.$inferSelect | null> {
  try {
    const [snapshot] = await db.select().from(snapshots).where(eq(snapshots.id, snapshotId)).limit(1)
    return snapshot
  } catch (error) {
    logger.error(error)
    throw ApplicationFailure.retryable(
      `Failed to get existing snapshot: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}

export async function takeScreenshot(params: CaptureScreenshotParams): Promise<CaptureScreenshotResult> {
  let browserEngine: IBrowserEngine | undefined
  try {
    logger.info(`Launching browser engine`, { payload: params.payload })
    browserEngine = await BrowserEngineFactory.create(BROWSER_ENGINE_TYPE || BrowserEngineType.SELENIUM, params.payload)

    const capturer = new ScreenshotCapturer({
      ...params,
      browserEngine,
      heartbeat: async (details) => {
        const message = ((details || {}) as { message: string | undefined })?.message
        if (message) {
          logger.info(message, { payload: params.payload })
        }

        const ctx = Context.current()
        ctx.heartbeat(details)
        if (ctx.cancellationSignal.aborted) {
          throw new CancelledFailure('Activity cancellation requested')
        }
      },
    })

    return await capturer.capture()
  } catch (error) {
    if (error instanceof ApplicationFailure || error instanceof CancelledFailure) {
      throw error
    }

    if (error instanceof UnsupportedBrowserEngineError) {
      logger.error(`Unsupported browser engine: ${error.message}`, { payload: params.payload })
      throw ApplicationFailure.nonRetryable(error.message, error.name)
    }

    if (error instanceof UnsupportedBrowserTypeError) {
      logger.error(`Unsupported browser type: ${error.message}`, { payload: params.payload })
      throw ApplicationFailure.nonRetryable(error.message, error.name)
    }

    if (error instanceof Error && error.message.includes('429 Too Many Requests')) {
      throw ApplicationFailure.create({
        message: 'Browserless concurrency limit exceeded',
        type: error.name,
        cause: error,
        nonRetryable: false,
        nextRetryDelay: 30000,
      })
    }

    logger.error(`Failed to capture screenshot: ${error instanceof Error ? error.message : ''}`, {
      payload: params.payload,
    })
    throw ApplicationFailure.retryable(
      `Failed to capture screenshot: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  } finally {
    logger.info(`Closing browser engine`, { payload: params.payload })
    browserEngine?.quit().catch(() => {})
  }
}

export async function processScreenshot(params: ProcessScreenshotParams): Promise<ProcessScreenshotResult> {
  try {
    fs.accessSync(params.tempPath, fs.constants.R_OK)
  } catch {
    logger.error(`Screenshot file not found at path: ${params.tempPath}`, { payload: params.payload })
    throw ApplicationFailure.nonRetryable(`Screenshot file not found: ${params.tempPath}`, 'FileNotFound')
  }

  try {
    const { snapshot } = await new ScreenshotProcessor(params).process()

    fs.rmSync(params.tempPath, { force: true })

    return { snapshot }
  } catch (error) {
    logger.error(`Failed to process screenshot: ${error instanceof Error ? error.message : ''}`, {
      payload: params.payload,
    })
    throw ApplicationFailure.retryable(
      `Failed to process screenshot: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}

export async function finalizeBuildSnapshots({ buildId, status }: { buildId: string; status: BuildStatus }) {
  try {
    const [build] = await db.select().from(builds).where(eq(builds.id, buildId)).limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found`)
    }

    await db.transaction(async (tx) => {
      build.status = status

      await tx.update(builds).set({ status: build.status }).where(eq(builds.id, build.id)).returning()

      await syncBuildStatusBasedOnSnapshotApprovals({ dbOrTx: tx, build })
    })
  } catch (error) {
    if (error instanceof ApplicationFailure) {
      throw error
    }

    logger.error(error)
    throw ApplicationFailure.retryable(
      `Failed to finalize build snapshots: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}

export async function notifyBuildReadyForReview({ projectId, buildId }: { projectId: string; buildId: string }) {
  try {
    const [build] = await db
      .select()
      .from(builds)
      .where(and(eq(builds.id, buildId), eq(builds.projectId, projectId)))
      .limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found`)
    }

    if (build.status !== BuildStatus.WAITING_REVIEW) {
      logger.info(`Build ID ${buildId} is not in waiting_review status, skipping notification`)
      return
    }

    const snapshotRows = await db
      .select({
        id: snapshots.id,
        diffPercentage: snapshots.diffPercentage,
      })
      .from(snapshots)
      .where(eq(snapshots.buildId, buildId))

    const totalSnapshotCount = snapshotRows.length
    const hasDiffSnapshotCount = snapshotRows.filter(
      (row) => !isSnapshotExactlyMatching(row.diffPercentage, build.diffTolerancePercentage),
    ).length
    const pagePath = `/builds/${buildId}/snapshots` as Route

    for (const subscribers of await getNovuSubscribers()) {
      await novu.trigger({
        workflowId: NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW,
        to: subscribers,
        payload: {
          buildIdentifier: build.identifier,
          hasDiffSnapshotCount,
          totalSnapshotCount,
          actionLink: `${APP_URL}${pagePath}`,
        },
      })
    }
  } catch (error) {
    if (error instanceof ApplicationFailure) {
      throw error
    }

    logger.error(error)
    throw ApplicationFailure.retryable(
      `Failed to send notification: ${error instanceof Error ? error.message : error}`,
      error instanceof Error ? error.name : 'UnknownError',
      [{ error }],
    )
  }
}
