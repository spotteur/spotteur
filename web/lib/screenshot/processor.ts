import * as fs from 'node:fs'

import { eq } from 'drizzle-orm'
import sharp from 'sharp'

import { SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { generateSnapshotFileName, getBaselineSnapshot } from '@/features/snapshots/actions'
import { bufferFromUrl, getImageDiff, ImageDiffDimensionMismatchError } from '@/lib/image-diff'
import { logger } from '@/lib/logger'
import { getPresignUrl, uploadFileFromBuffer } from '@/lib/s3'
import { type ProcessScreenshotResult, type ProcessScreenshotParams, type SnapshotPayload } from '@/types/screenshot'

export class ScreenshotProcessor {
  private payload: SnapshotPayload
  private logPrefix: string
  private tempPath: string

  constructor(args: ProcessScreenshotParams) {
    this.payload = args.payload
    this.logPrefix = args.logPrefix
    this.tempPath = args.tempPath
  }

  public async process(): Promise<ProcessScreenshotResult> {
    const { snapshot } = await db.transaction(async (tx) => {
      logger.info(`${this.logPrefix} Processing screenshot from ${this.tempPath}`)
      const image = sharp(fs.readFileSync(this.tempPath)).ensureAlpha().raw().toFormat('png')
      const { data: buffer, info } = await image.toBuffer({ resolveWithObject: true })

      const s3Path = `${this.payload.s3Prefix}/${this.payload.fileName}`
      await uploadFileFromBuffer(buffer, s3Path, 'image/png')

      const [screenshotMedia] = await tx
        .insert(media)
        .values({
          fileName: this.payload.fileName,
          fileSize: buffer.length,
          mimeType: 'image/png',
          path: s3Path,
          width: info.width,
          height: info.height,
        })
        .onConflictDoUpdate({
          target: media.path,
          set: {
            fileName: this.payload.fileName,
            fileSize: buffer.length,
            mimeType: 'image/png',
            width: info.width,
            height: info.height,
          },
        })
        .returning()

      let baselineScreenshotMediaId: string | null = null
      let diffScreenshotMediaId: string | null = null
      let diffPercentage: number = 100

      logger.info(`${this.logPrefix} Checking baseline screenshot`)
      const [build] = await tx.select().from(builds).where(eq(builds.id, this.payload.buildId)).limit(1)
      if (build.baselineBuildId) {
        const baselineSnapshot = await getBaselineSnapshot({
          dbOrTx: tx,
          baselineBuildId: build.baselineBuildId,
          payload: this.payload,
        })
        if (baselineSnapshot && baselineSnapshot.screenshotMedia) {
          try {
            logger.info(`${this.logPrefix} Found baseline screenshot`)

            baselineScreenshotMediaId = baselineSnapshot.screenshotMedia.id
            const mediaUrl = await getPresignUrl({ key: baselineSnapshot.screenshotMedia.path })

            logger.info(`${this.logPrefix} Downloading baseline screenshot`)
            const baselineBuffer = await bufferFromUrl(mediaUrl)

            logger.info(`${this.logPrefix} Calculating image diff`)
            const { diffImage: diffScreenshotBuffer, diffPercentage: diff } = await getImageDiff({
              imgBuffer1: buffer,
              imgBuffer2: baselineBuffer,
            })

            const diffFileName = await generateSnapshotFileName({ pageUrl: this.payload.pageUrl, type: 'diff' })
            const diffS3Path = `${this.payload.s3Prefix}/${diffFileName}`

            await uploadFileFromBuffer(diffScreenshotBuffer, diffS3Path, 'image/png')

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
              .onConflictDoUpdate({
                target: media.path,
                set: {
                  fileName: diffFileName,
                  fileSize: diffScreenshotBuffer.length,
                  mimeType: 'image/png',
                  width: info.width,
                  height: info.height,
                },
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

      // TODO: Maybe we can add this to project setting,
      // so user can decide wether auto-approved are allowed or not based on threshold.
      let approvalStatus = SnapshotApprovalStatus.PENDING
      if (diffPercentage === 0) {
        approvalStatus = SnapshotApprovalStatus.APPROVED
      }

      if (!baselineScreenshotMediaId) {
        logger.info(`${this.logPrefix} No baseline screenshot found, auto-approving snapshot`)
        approvalStatus = SnapshotApprovalStatus.APPROVED
      }

      logger.info(`${this.logPrefix} Storing record of snapshot`)
      const [snapshot] = await tx
        .insert(snapshots)
        .values({
          id: this.payload.id,
          buildId: this.payload.buildId,
          pagePath: this.payload.pagePath,
          browser: this.payload.browser,
          viewportWidth: this.payload.viewportWidth,
          viewportHeight: this.payload.viewportHeight,
          approvalStatus,
          diffPercentage,
          screenshotMediaId: screenshotMedia.id,
          baselineScreenshotMediaId,
          diffScreenshotMediaId,
        })
        .onConflictDoUpdate({
          target: snapshots.id,
          set: {
            approvalStatus,
            diffPercentage,
            screenshotMediaId: screenshotMedia.id,
            baselineScreenshotMediaId,
            diffScreenshotMediaId,
          },
        })
        .returning()

      return { snapshot }
    })

    return { snapshot }
  }
}
