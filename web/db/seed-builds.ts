import fs from 'node:fs'

import { desc, eq } from 'drizzle-orm'
import sharp from 'sharp'

import {
  DEFAULT_SNAPSHOTS_BROWSER,
  DEFAULT_SNAPSHOTS_HEIGHT,
  DEFAULT_SNAPSHOTS_SELECTOR,
  DEFAULT_SNAPSHOTS_WIDTH,
} from '@/constants/app'
import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import db from '@/db/drizzle'
import { builds, media, projects, snapshots } from '@/db/schema'
import { populateSnapshotsPayload } from '@/features/builds/actions'
import { generateSnapshotFileName, generateSnapshotPath } from '@/features/snapshots/actions'
import { getImageDiff } from '@/lib/image-diff'
import { logger } from '@/lib/logger'
import { uploadFileFromBuffer } from '@/lib/s3'
import { humanReadableEpoch, randomElement } from '@/lib/utils'

async function getSeedScreenshotBuffer() {
  const fileNames = ['raw.jpg', 'blur_10.jpg']
  const path = `${process.cwd()}/public/seeds/${randomElement(fileNames)}`

  const buffer = fs.readFileSync(path)
  const image = sharp(buffer).ensureAlpha().raw()

  const { data, info } = await image.toBuffer({ resolveWithObject: true })

  return {
    data,
    info,
    buffer,
  }
}

async function createMediaRecord(
  fileName: string,
  fileSize: number,
  s3Path: string,
  width: number,
  height: number,
): Promise<string> {
  const [record] = await db
    .insert(media)
    .values({
      fileName,
      fileSize,
      mimeType: 'image/png',
      width,
      height,
      path: s3Path,
    })
    .returning()

  return record.id
}

async function main() {
  logger.info('Start seeding builds and snapshots...')

  const existingProjects = await db.select().from(projects).limit(1).orderBy(desc(projects.createdAt))
  let project: typeof projects.$inferSelect

  if (existingProjects.length > 0) {
    project = existingProjects[0]
    logger.info(`Using existing project: ${existingProjects[0].name}`)
  } else {
    const [newProject] = await db
      .insert(projects)
      .values({
        name: 'Demo Project - Kororo',
        baseUrl: 'https://kororo.co/',
        token: crypto.randomUUID(),
        snapshotBrowsers: [DEFAULT_SNAPSHOTS_BROWSER],
        viewports: [[DEFAULT_SNAPSHOTS_WIDTH, DEFAULT_SNAPSHOTS_HEIGHT]],
        pagePaths: ['/', '/works', '/company'],
      })
      .returning()

    project = newProject
    logger.info(`Created new project: ${newProject.name}`)
  }

  const existingBuilds = await db.select().from(builds).where(eq(builds.projectId, project.id))

  const buildCount = 3
  for (let i = 0; i < buildCount; i++) {
    const [build] = await db
      .insert(builds)
      .values({
        projectId: project.id,
        baseUrl: project.baseUrl,
        status: randomElement(Object.values(BuildStatus)),
        identifier: `build-${humanReadableEpoch()}-${i}`,
        pagePaths: project.pagePaths,
        baselineBuildId: existingBuilds.length > 0 ? randomElement(existingBuilds).id : null,
      })
      .returning()

    logger.info(`Created build: ${build.identifier}`)

    const mimeType = 'image/png'

    const snapshotPayloads = await populateSnapshotsPayload({ build: build, project: project })

    for (const snapshotPayload of snapshotPayloads) {
      try {
        const prefix = await generateSnapshotPath({
          projectId: project.id,
          buildId: snapshotPayload.buildId,
          snapshotId: snapshotPayload.id,
        })

        // Current screenshot
        const {
          buffer: screenshotBuffer,
          info: { height, width },
        } = await getSeedScreenshotBuffer()
        const fileName = await generateSnapshotFileName({ pageUrl: snapshotPayload.pageUrl, type: 'screenshot' })
        const s3Path = await uploadFileFromBuffer(screenshotBuffer, prefix + fileName, mimeType)
        const mediaId = await createMediaRecord(fileName, screenshotBuffer.length, s3Path, width, height)

        // Baseline screenshot
        const { buffer: baselineScreenshotBuffer } = await getSeedScreenshotBuffer()
        const baselineFileName = await generateSnapshotFileName({
          pageUrl: snapshotPayload.pageUrl,
          type: 'baseline-screenshot',
        })
        const baselineS3Path = await uploadFileFromBuffer(baselineScreenshotBuffer, prefix + baselineFileName, mimeType)
        const baselineMediaId = await createMediaRecord(
          baselineFileName,
          baselineScreenshotBuffer.length,
          baselineS3Path,
          width,
          height,
        )

        // Diff heatmap
        const { diffImage: diffScreenshotBuffer, diffPercentage } = await getImageDiff({
          imgBuffer1: screenshotBuffer,
          imgBuffer2: baselineScreenshotBuffer,
          threshold: 0.2,
        })
        const diffFileName = await generateSnapshotFileName({ pageUrl: snapshotPayload.pageUrl, type: 'diff' })
        const diffS3Path = await uploadFileFromBuffer(diffScreenshotBuffer, prefix + diffFileName, mimeType)
        const diffMediaId = await createMediaRecord(
          diffFileName,
          diffScreenshotBuffer.length,
          diffS3Path,
          width,
          height,
        )

        await db.insert(snapshots).values({
          id: snapshotPayload.id,
          buildId: snapshotPayload.buildId,
          viewportWidth: snapshotPayload.viewportWidth,
          viewportHeight: snapshotPayload.viewportHeight,
          browser: snapshotPayload.browser,
          pagePath: snapshotPayload.pagePath,
          approvalStatus: randomElement(Object.values(SnapshotApprovalStatus)),
          screenshotMediaId: mediaId,
          baselineScreenshotMediaId: baselineMediaId,
          diffScreenshotMediaId: diffMediaId,
          diffPercentage,
        })
      } catch (error) {
        logger.error('Error creating snapshot for', snapshotPayload.pagePath, 'Error:', error)
      }
    }

    logger.info('')
  }

  logger.info('Seed completed successfully!')
  process.exit(0)
}

main().catch((error) => {
  logger.error('Seed failed:', error)
  process.exit(1)
})
