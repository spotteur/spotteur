import * as fs from 'node:fs'

import { ApplicationFailure } from '@temporalio/common'
import { eq } from 'drizzle-orm'
import sharp from 'sharp'
import * as uuid from 'uuid'

import { SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { generateSnapshotFileName, generateSnapshotPath, getBaselineSnapshot } from '@/features/snapshots/actions'
import { bufferFromUrl, getImageDiff } from '@/lib/image-diff'
import { getPresignUrl } from '@/lib/s3'
import { captureScreenshot, uploadScreenshot } from '@/lib/screenshot'
import { type SnapshotPayload, type ScreenshotOptions } from '@/types/screenshot'

export async function takeScreenshot(opts: ScreenshotOptions) {
  try {
    console.log(`Taking screenshot of ${opts.url}`)
    const result = await captureScreenshot(opts)
    const tmpPath = `/tmp/${uuid.v4()}.png`
    fs.writeFileSync(tmpPath, result.buffer)
    console.log(`Screenshot captured, saved to: ${tmpPath}`)
    return tmpPath
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}

type ProcessScreenshotParams = {
  projectId: string
  payload: SnapshotPayload
  tempPath: string
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
      const image = sharp(fs.readFileSync(tempPath)).ensureAlpha().raw()
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
      let diffPercentage: number = 0

      console.log('Checking baseline screenshot for snapshot', payload.id)
      const [build] = await tx.select().from(builds).where(eq(builds.id, payload.buildId)).limit(1)
      if (build.baselineBuildId) {
        const baselineSnapshot = await getBaselineSnapshot({
          dbOrTx: tx,
          baselineBuildId: build.baselineBuildId,
          payload,
        })
        if (baselineSnapshot && baselineSnapshot.screenshotMedia) {
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
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}
