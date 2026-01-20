import * as fs from 'node:fs'

import { ApplicationFailure } from '@temporalio/common'
import { and, eq } from 'drizzle-orm'
import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW } from '@/constants/novu'
import { BuildStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, snapshots } from '@/db/schema'
import { getNovuSubscribers, syncBuildStatusBasedOnSnapshotApprovals } from '@/features/builds/actions'
import { UnsupportedBrowserEngineError } from '@/lib/browser-engine'
import novu from '@/lib/novu'
import { ScreenshotCapturer } from '@/lib/screenshot/capturer'
import { ScreenshotProcessor } from '@/lib/screenshot/processor'
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

    await db.update(builds).set({ status: BuildStatus.in_progress }).where(eq(builds.id, buildId))
  } catch (err) {
    if (err instanceof ApplicationFailure) {
      throw err
    }

    console.error(err)
    throw ApplicationFailure.retryable(`Failed to mark build as started: ${err instanceof Error ? err.message : err}`)
  }
}

export async function takeScreenshot(params: CaptureScreenshotParams): Promise<CaptureScreenshotResult> {
  try {
    return await new ScreenshotCapturer(params).capture()
  } catch (err) {
    if (err instanceof UnsupportedBrowserEngineError) {
      throw ApplicationFailure.nonRetryable(err.message)
    }

    console.error(err)
    throw ApplicationFailure.retryable(`Failed to capture screenshot: ${err instanceof Error ? err.message : err}`)
  }
}

export async function processScreenshot(params: ProcessScreenshotParams): Promise<ProcessScreenshotResult> {
  try {
    fs.accessSync(params.tempPath, fs.constants.R_OK)
  } catch {
    throw ApplicationFailure.nonRetryable(`Screenshot file not found: ${params.tempPath}`)
  }

  try {
    const { snapshot } = await new ScreenshotProcessor(params).process()

    fs.rmSync(params.tempPath, { force: true })

    return { snapshot }
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable(`Failed to process screenshot: ${err instanceof Error ? err.message : err}`)
  }
}

export async function finalizeBuildSnapshots({ buildId, isSuccess }: { buildId: string; isSuccess?: boolean }) {
  try {
    const [build] = await db.select().from(builds).where(eq(builds.id, buildId)).limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found`)
    }

    await db.transaction(async (tx) => {
      build.status = isSuccess ? BuildStatus.waiting_review : BuildStatus.error

      await tx.update(builds).set({ status: build.status }).where(eq(builds.id, build.id)).returning()

      await syncBuildStatusBasedOnSnapshotApprovals({ dbOrTx: tx, build })
    })
  } catch (err) {
    if (err instanceof ApplicationFailure) {
      throw err
    }

    console.error(err)
    throw ApplicationFailure.retryable(
      `Failed to finalize build snapshots: ${err instanceof Error ? err.message : err}`,
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

    if (build.status !== BuildStatus.waiting_review) {
      console.log(`Build ID ${buildId} is not in waiting_review status, skipping notification`)
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
    const hasDiffSnapshotCount = snapshotRows.filter((row) => row.diffPercentage > 0).length
    const pagePath = `/projects/${projectId}/builds/${buildId}/snapshots` as Route

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
  } catch (err) {
    if (err instanceof ApplicationFailure) {
      throw err
    }

    console.error(err)
    throw ApplicationFailure.retryable(`Failed to send notification: ${err instanceof Error ? err.message : err}`)
  }
}
