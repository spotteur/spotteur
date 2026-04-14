import * as fs from 'node:fs'

import { eq, sql } from 'drizzle-orm'
import sharp from 'sharp'

import { SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, snapshots } from '@/db/schema'
import { generateSnapshotFileNameJpeg, getBaselineSnapshot } from '@/features/snapshots/actions'
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
      logger.info(`${this.logPrefix} Processing screenshot from ${this.tempPath}`, { payload: this.payload })
      const image = sharp(fs.readFileSync(this.tempPath)).ensureAlpha().raw().toFormat('png')
      const { data: buffer } = await image.toBuffer({ resolveWithObject: true })

      // convert to jpeg
      const jpgImage = sharp(buffer).jpeg({ quality: 75 })
      const { data: jpegBuffer, info: jpegInfo } = await jpgImage.toBuffer({ resolveWithObject: true })
      const newFileName = await generateSnapshotFileNameJpeg({ pageUrl: this.payload.pageUrl, type: 'screenshot' })
      const s3Path = `${this.payload.s3Prefix}/${newFileName}`

      // upload converted image to s3
      await uploadFileFromBuffer(jpegBuffer, s3Path, 'image/jpeg')

      const [screenshotMedia] = await tx
        .insert(media)
        .values({
          fileName: this.payload.fileName,
          fileSize: buffer.length,
          mimeType: 'image/jpeg',
          path: s3Path,
          width: jpegInfo.width,
          height: jpegInfo.height,
        })
        .onConflictDoUpdate({
          target: media.path,
          set: {
            fileName: sql.raw(`excluded.${media.fileName.name}`),
            fileSize: sql.raw(`excluded.${media.fileSize.name}`),
            mimeType: sql.raw(`excluded.${media.mimeType.name}`),
            width: sql.raw(`excluded.${media.width.name}`),
            height: sql.raw(`excluded.${media.height.name}`),
          },
        })
        .returning()

      let baselineScreenshotMediaId: string | null = null
      let diffScreenshotMediaId: string | null = null
      let diffPercentage: number = 100

      logger.info(`${this.logPrefix} Checking baseline screenshot`, { payload: this.payload })
      const [build] = await tx.select().from(builds).where(eq(builds.id, this.payload.buildId)).limit(1)
      if (build.baselineBuildId) {
        const baselineSnapshot = await getBaselineSnapshot({
          dbOrTx: tx,
          baselineBuildId: build.baselineBuildId,
          payload: this.payload,
        })
        if (baselineSnapshot && baselineSnapshot.screenshotMedia) {
          try {
            logger.info(`${this.logPrefix} Found baseline screenshot`, { payload: this.payload })

            baselineScreenshotMediaId = baselineSnapshot.screenshotMedia.id
            const mediaUrl = await getPresignUrl({ key: baselineSnapshot.screenshotMedia.path })

            logger.info(`${this.logPrefix} Downloading baseline screenshot`, { payload: this.payload })
            const baselineBuffer = await bufferFromUrl(mediaUrl)

            // convert baseline image to png first
            const baselineImage = sharp(baselineBuffer).ensureAlpha().raw().toFormat('png')
            const { data: baselineBufferPng } = await baselineImage.toBuffer({ resolveWithObject: true })

            logger.info(`${this.logPrefix} Calculating image diff`, { payload: this.payload })
            const { diffImage: diffScreenshotBuffer, diffPercentage: diff } = await getImageDiff({
              imgBuffer1: buffer,
              imgBuffer2: baselineBufferPng,
            })

            const diffFileName = await generateSnapshotFileNameJpeg({ pageUrl: this.payload.pageUrl, type: 'diff' })
            const diffS3Path = `${this.payload.s3Prefix}/${diffFileName}`

            // convert diff image to jpeg
            const diffScreenshotImage = sharp(diffScreenshotBuffer).jpeg({ quality: 75 })
            const { data: diffScreenshotBufferJpeg } = await diffScreenshotImage.toBuffer({ resolveWithObject: true })

            await uploadFileFromBuffer(diffScreenshotBufferJpeg, diffS3Path, 'image/jpeg')

            const [diffScreenshotMedia] = await tx
              .insert(media)
              .values({
                fileName: diffFileName,
                fileSize: diffScreenshotBuffer.length,
                mimeType: 'image/jpeg',
                path: diffS3Path,
                width: jpegInfo.width,
                height: jpegInfo.height,
              })
              .onConflictDoUpdate({
                target: media.path,
                set: {
                  fileName: sql.raw(`excluded.${media.fileName.name}`),
                  fileSize: sql.raw(`excluded.${media.fileSize.name}`),
                  mimeType: sql.raw(`excluded.${media.mimeType.name}`),
                  width: sql.raw(`excluded.${media.width.name}`),
                  height: sql.raw(`excluded.${media.height.name}`),
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
        logger.info(`${this.logPrefix} No baseline screenshot found, auto-approving snapshot`, {
          payload: this.payload,
        })
        approvalStatus = SnapshotApprovalStatus.APPROVED
      }

      logger.info(`${this.logPrefix} Storing record of snapshot`, { payload: this.payload })
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
            approvalStatus: sql.raw(`excluded.${snapshots.approvalStatus.name}`),
            diffPercentage: sql.raw(`excluded.${snapshots.diffPercentage.name}`),
            screenshotMediaId: sql.raw(`excluded.${snapshots.screenshotMediaId.name}`),
            baselineScreenshotMediaId: sql.raw(`excluded.${snapshots.baselineScreenshotMediaId.name}`),
            diffScreenshotMediaId: sql.raw(`excluded.${snapshots.diffScreenshotMediaId.name}`),
          },
        })
        .returning()

      return { snapshot }
    })

    return { snapshot }
  }
}
