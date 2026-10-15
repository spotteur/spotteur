import { ApplicationFailure } from '@temporalio/common'
import * as uuid from 'uuid'

import { ACCESSIBILITY_SCAN_APP_KEY, ACCESSIBILITY_SCAN_APP_URL, APP_URL } from '@/constants/env'
import db from '@/db/drizzle'
import { webhookEvents } from '@/db/schema'
import { logger } from '@/lib/logger'
import { randomBytesHex } from '@/lib/utils'

export async function checkAccessibilityScanCredentials(
  endpoint: string = ACCESSIBILITY_SCAN_APP_URL,
  key: string = ACCESSIBILITY_SCAN_APP_KEY,
) {
  const res = await fetch(endpoint, { headers: { 'x-api-key': key } })
  return res.ok
}

export async function generateTriggerOptions() {
  const requestId = uuid.v4()
  const callbackUrl = new URL('/api/callback', APP_URL).toString()
  const callbackSecret = randomBytesHex(16)

  return { requestId, callbackUrl, callbackSecret }
}

interface AccessibilityScanTriggerParams {
  pageUrl: string
  requestId: string
  options: {
    callbackUrl: string
    callbackSecret: string
  }
}

export async function triggerAccessibilityScan({
  pageUrl,
  requestId,
  options: { callbackUrl, callbackSecret },
}: AccessibilityScanTriggerParams): Promise<string> {
  const res = await fetch(ACCESSIBILITY_SCAN_APP_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ACCESSIBILITY_SCAN_APP_KEY },
    body: JSON.stringify({ pageUrl, requestId, options: { callbackUrl, callbackSecret } }),
  })
  if (!res.ok) {
    const failureMsg =
      `[${requestId}] Failed to trigger accessibility scan, ` +
      `service responded with ${res.status} (Body: ${await res.text()})`
    const isTransient = res.status === 429 || res.status === 408
    const isNonRetryable = res.status >= 400 && res.status < 500 && !isTransient
    if (isNonRetryable) {
      throw ApplicationFailure.nonRetryable(failureMsg)
    }
    throw ApplicationFailure.retryable(failureMsg)
  }
  const { scanId } = await res.json()
  logger.info(`Accessibility scan triggered successfully for page: ${pageUrl}`)
  logger.info(`Scan ID: ${scanId}`)

  return scanId
}

interface AccessibilityEventShadowDataInput {
  scanId: string
  requestId: string
  callbackSecret: string
}

export async function writeAccessibilityScanEventShadowData({
  scanId,
  requestId,
  callbackSecret,
}: AccessibilityEventShadowDataInput) {
  await db
    .insert(webhookEvents)
    .values({ id: scanId, publicId: requestId, type: 'accessibility_scan', secret: callbackSecret })
}
