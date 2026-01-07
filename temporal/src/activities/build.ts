import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'crypto'

import { ApplicationFailure } from '@temporalio/common'
import { PutObjectCommand } from '@aws-sdk/client-s3'

import { S3_BUCKET } from '../constants/env.ts'
import { s3Client } from '../utils/s3.ts'
import { captureScreenshot } from '../utils/screenshot.ts'
import type { ScreenshotOptions } from '../types/screenshot.ts'

const sha256Hex = (input: string) => crypto.createHash('sha256').update(Buffer.from(input, 'utf-8')).digest('hex')

export async function takeScreenshot(opts: ScreenshotOptions) {
  try {
    console.log(`Taking screenshot of ${opts.url}`)
    const result = await captureScreenshot(opts)
    const tmpPath = `/tmp/spotteur/${sha256Hex(opts.url)}.png`
    fs.writeFileSync(tmpPath, result.buffer)
    console.log(`Screenshot captured, saved to: ${tmpPath}`)
    return tmpPath
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}

type SaveScreenshotParams = {
  projectId: string | number
  buildId: string | number
  url: string
  file: string
}

export async function saveScreenshot({ projectId, buildId, url, file }: SaveScreenshotParams) {
  try {
    fs.accessSync(file, fs.constants.R_OK)
  } catch {
    throw ApplicationFailure.nonRetryable(`Upload target not found: ${file}`)
  }

  const filename = path.basename(file)
  const key = `${projectId}/${buildId}/${filename}.png`
  console.log(`Saving screenshot to ${key}`)
  try {
    const res = await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fs.createReadStream(file),
        ContentType: 'image/png',
      }),
    )
    return 'Screenshot saved'
  } catch (err) {
    console.error(err)
    throw ApplicationFailure.retryable('Uncaught error!')
  }
}
