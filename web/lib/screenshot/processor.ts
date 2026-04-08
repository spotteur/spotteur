import * as fs from 'node:fs'

import { eq, sql } from 'drizzle-orm'
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
      logger.info(`${this.logPrefix} Processing screenshot from ${this.tempPath}`, { payload: this.payload })
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

            logger.info(`${this.logPrefix} Calculating image diff`, { payload: this.payload })
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
