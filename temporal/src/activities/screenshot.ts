import { ApplicationFailure } from '@temporalio/common'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import * as crypto from 'crypto'

import { S3_BUCKET } from '../constants/env.ts'
import type { ScreenshotOptions } from '../types/screenshot.ts'
import { captureScreenshot } from '../utils/screenshot.ts'
import { s3Client } from '../utils/s3.ts'

export async function getScreenshotPaths(projectId: string | number) {
  // TODO: Fetch project settings from DB
  const baseUrl = ''
  const paths: string[] = []
  if (!paths.length) {
    throw ApplicationFailure.nonRetryable(`Project ID ${projectId} has no paths set`)
  }
  return paths.map((p) => new URL(p, baseUrl).toString())
}

export async function takeScreenshot(opts: ScreenshotOptions) {
  try {
    console.log(`Taking screenshot of ${opts.url}`)
    return captureScreenshot(opts)
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}

export async function saveScreenshot(
  projectId: string | number,
  buildId: string | number,
  url: string,
  buffer: Buffer,
) {
  const urlHash = crypto.createHash('sha256').update(Buffer.from(url, 'utf-8')).digest('hex')
  const key = `${projectId}/${buildId}/${urlHash}.png`
  console.log(`Saving screenshot to ${key}`)
  try {
    const res = await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: Buffer.from(buffer),
        ContentType: 'image/png',
      }),
    )
    return 'Screenshot saved'
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}
