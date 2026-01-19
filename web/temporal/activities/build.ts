import * as fs from 'node:fs'

import { ApplicationFailure } from '@temporalio/common'
import { and, eq } from 'drizzle-orm'
import { type Route } from 'next'
import sharp from 'sharp'
import * as uuid from 'uuid'

import { BROWSER_LABEL_MAP } from '@/constants/enum'
import { APP_URL } from '@/constants/env'
import { NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW } from '@/constants/novu'
import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { getNovuSubscribers } from '@/features/builds/actions'
import { generateSnapshotFileName, generateSnapshotPath, getBaselineSnapshot } from '@/features/snapshots/actions'
import { bufferFromUrl, getImageDiff, ImageDiffDimensionMismatchError } from '@/lib/image-diff'
import novu from '@/lib/novu'
import { getPresignUrl } from '@/lib/s3'
import { captureScreenshot, uploadScreenshot } from '@/lib/screenshot'
import { type ScreenshotOptions, type ProcessScreenshotParams } from '@/types/screenshot'

export async function takeScreenshot(opts: ScreenshotOptions) {
  try {
    console.log(`Taking screenshot of ${opts.url} using browser ${BROWSER_LABEL_MAP[opts.browser]}`)
    const result = await captureScreenshot(opts)
    const tmpPath = `/tmp/${uuid.v4()}-${opts.browser}.png`
    fs.writeFileSync(tmpPath, result.buffer)
    console.log(`Screenshot captured, saved to: ${tmpPath}`)
    return tmpPath
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Failed to take screenshot')
  }
}

export async function processScreenshot({ projectId, payload, tempPath }: ProcessScreenshotParams) {
  try {
    fs.accessSync(tempPath, fs.constants.R_OK)
  } catch {
    throw ApplicationFailure.nonRetryable(`Upload target not found: ${tempPath}`)
  }

  try {
    const { snapshot } = await db.transaction(async (tx) => {
      console.log('Processing screenshot from', tempPath, 'for snapshot', payload.id)
      const image = sharp(fs.readFileSync(tempPath)).ensureAlpha().raw().toFormat('png')
      const { data: buffer, info } = await image.toBuffer({ resolveWithObject: true })

      const fileName = await generateSnapshotFileName({ pageUrl: payload.pageUrl, type: 'screenshot' })
      const s3Prefix = await generateSnapshotPath({ projectId, buildId: payload.buildId, snapshotId: payload.id })
      const s3Path = `${s3Prefix}/${fileName}`

      await uploadScreenshot(buffer, s3Path, 'image/png')

      const [screenshotMedia] = await tx
        .insert(media)
        .values({
          fileName,
          fileSize: buffer.length,
          mimeType: 'image/png',
          path: s3Path,
          width: info.width,
          height: info.height,
        })
        .returning()

      let baselineScreenshotMediaId: string | null = null
      let diffScreenshotMediaId: string | null = null
      let diffPercentage: number = 100

      console.log('Checking baseline screenshot for snapshot', payload.id)
      const [build] = await tx.select().from(builds).where(eq(builds.id, payload.buildId)).limit(1)
      if (build.baselineBuildId) {
        const baselineSnapshot = await getBaselineSnapshot({
          dbOrTx: tx,
          baselineBuildId: build.baselineBuildId,
          payload,
        })
        if (baselineSnapshot && baselineSnapshot.screenshotMedia) {
          try {
            console.log('Found baseline screenshot for snapshot', payload.id)

            baselineScreenshotMediaId = baselineSnapshot.screenshotMedia.id
            const mediaUrl = await getPresignUrl({ key: baselineSnapshot.screenshotMedia.path })

            console.log('Downloading baseline screenshot for snapshot', payload.id)
            const baselineBuffer = await bufferFromUrl(mediaUrl)

            console.log('Calculating image diff for snapshot', payload.id)
            const { diffImage: diffScreenshotBuffer, diffPercentage: diff } = await getImageDiff({
              imgBuffer1: buffer,
              imgBuffer2: baselineBuffer,
            })

            const diffFileName = await generateSnapshotFileName({ pageUrl: payload.pageUrl, type: 'diff' })
            const diffS3Path = `${s3Prefix}/${diffFileName}`

            await uploadScreenshot(diffScreenshotBuffer, diffS3Path, 'image/png')

            const [diffScreenshotMedia] = await tx
              .insert(media)
              .values({
                fileName: diffFileName,
                fileSize: diffScreenshotBuffer.length,
                mimeType: 'image/png',
                path: diffS3Path,
                width: info.width,
                height: info.height,
              })
              .returning()

            diffPercentage = diff
            diffScreenshotMediaId = diffScreenshotMedia.id
          } catch (error) {
            if (!(error instanceof ImageDiffDimensionMismatchError)) {
              throw error
            }
          }
        }
      }

      if (!baselineScreenshotMediaId) {
        console.log('No baseline screenshot found for snapshot', payload.id)
      }

      console.log('Storing record of snapshot', payload.id)
      const [snapshot] = await tx
        .insert(snapshots)
        .values({
          id: payload.id,
          buildId: payload.buildId,
          pagePath: payload.pagePath,
          browser: payload.browser,
          viewportWidth: payload.viewportWidth,
          viewportHeight: payload.viewportHeight,
          approvalStatus: SnapshotApprovalStatus.pending,
          diffPercentage: diffPercentage,
          screenshotMediaId: screenshotMedia.id,
          baselineScreenshotMediaId,
          diffScreenshotMediaId,
        })
        .returning()

      return { snapshot }
    })

    fs.rmSync(tempPath, { force: true })

    return snapshot
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Failed to process screenshot')
  }
}

export async function finalizeBuildSnapshots({ buildId, isSuccess }: { buildId: string; isSuccess?: boolean }) {
  try {
    const [build] = await db.select().from(builds).where(eq(builds.id, buildId)).limit(1)
    if (!build) {
      throw ApplicationFailure.nonRetryable(`Build ID ${buildId} not found`)
    }

    await db
      .update(builds)
      .set({ status: isSuccess ? BuildStatus.waiting_review : BuildStatus.error })
      .where(eq(builds.id, buildId))
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Failed to finalize build snapshots')
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
    console.error(err)
    throw ApplicationFailure.retryable('Failed to send notification')
  }
}
