import fs from 'node:fs'

import { PutObjectCommand } from '@aws-sdk/client-s3'
import { desc, eq } from 'drizzle-orm'
import sharp from 'sharp'

import { PUBLIC_S3_HOST, PUBLIC_S3_PORT, S3_BUCKET } from '@/constants/env'
import db from '@/db/drizzle'
import { builds, media, projects, snapshots } from '@/db/schema'
import { getImageDiff } from '@/lib/image-diff'
import s3 from '@/lib/s3'
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

async function uploadScreenshotToS3(buffer: Buffer, key: string, mimeType: string): Promise<string> {
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  )
  return key
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
      mimeType: 'image/jpeg',
      width,
      height,
      path: `${PUBLIC_S3_HOST}:${PUBLIC_S3_PORT}/${S3_BUCKET}/${s3Path}`,
    })
    .returning()

  return record.id
}

async function main() {
  console.log('Start seeding builds and snapshots...')

  const existingProjects = await db.select().from(projects).limit(1).orderBy(desc(projects.createdAt))
  let project: typeof projects.$inferSelect

  if (existingProjects.length > 0) {
    project = existingProjects[0]
    console.log('Using existing project:', existingProjects[0].name)
  } else {
    const [newProject] = await db
      .insert(projects)
      .values({
        name: 'Demo Project - Kororo',
        baseUrl: 'https://kororo.co',
        token: crypto.randomUUID(),
        snapshotBrowser: 'chrome',
        snapshotSelector: 'body',
        snapshotWidth: 1024,
        snapshotHeight: 768,
        pagePaths: ['/', '/works', '/company'],
      })
      .returning()

    project = newProject
    console.log('Created new project:', newProject.name)
  }

  const existingBuilds = await db.select().from(builds).where(eq(builds.projectId, project.id))

  const buildCount = 3
  for (let i = 0; i < buildCount; i++) {
    const [build] = await db
      .insert(builds)
      .values({
        projectId: project.id,
        baseUrl: project.baseUrl,
        status: randomElement(['pending', 'in_progress', 'completed', 'failed']),
        identifier: `build-${humanReadableEpoch()}-${i}`,
        pagePaths: project.pagePaths,
        baselineBuildId: existingBuilds.length > 0 ? randomElement(existingBuilds).id : null,
      })
      .returning()

    console.log('Created build:', build.identifier)

    const mimeType = 'image/png'

    for (const pagePath of build.pagePaths) {
      try {
        const url = new URL(pagePath, build.baseUrl).toString()
        const prefix = `projects/${project.id}/builds/${build.id}/${url.replace(/[^a-zA-Z0-9.]/g, '-')}/`

        // Current screenshot
        const {
          buffer: screenshotBuffer,
          info: { height, width },
        } = await getSeedScreenshotBuffer()
        const fileName = `screenshot.png`
        const s3Path = await uploadScreenshotToS3(screenshotBuffer, prefix + fileName, mimeType)
        const mediaId = await createMediaRecord(fileName, screenshotBuffer.length, s3Path, width, height)

        // Baseline screenshot
        const { buffer: baselineScreenshotBuffer } = await getSeedScreenshotBuffer()
        const baselineFileName = `baseline-screenshot.png`
        const baselineS3Path = await uploadScreenshotToS3(baselineScreenshotBuffer, prefix + baselineFileName, mimeType)
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
        const diffFileName = `diff-screenshot.png`
        const diffS3Path = await uploadScreenshotToS3(diffScreenshotBuffer, prefix + diffFileName, mimeType)
        const diffMediaId = await createMediaRecord(
          diffFileName,
          diffScreenshotBuffer.length,
          diffS3Path,
          width,
          height,
        )

        await db.insert(snapshots).values({
          buildId: build.id,
          approvalStatus: randomElement(['pending', 'approved', 'rejected']),
          screenshotMediaId: mediaId,
          baselineScreenshotMediaId: baselineMediaId,
          diffScreenshotMediaId: diffMediaId,
          diffPercentage,
          width,
          height,
          pagePath,
        })

        console.log('Snapshot created for', pagePath)
      } catch (error) {
        console.error('Error creating snapshot for', pagePath, 'Error:', error)
      }
    }

    console.log('')
  }

  console.log('Seed completed successfully!')
  process.exit(0)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
