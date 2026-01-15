import { PutObjectCommand } from '@aws-sdk/client-s3'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import firefox from 'selenium-webdriver/firefox'

import {
  DEFAULT_SNAPSHOTS_HEIGHT,
  DEFAULT_SNAPSHOTS_WIDTH,
  DEFAULT_SNAPSHOTS_BROWSER,
  DEFAULT_SNAPSHOTS_SELECTOR,
} from '@/constants/app'
import { type Browser } from '@/constants/enum'
import { S3_BUCKET, SELENIUM_REMOTE_URL } from '@/constants/env'
import { scrollPageToBottom, waitForNetworkIdle, waitForPageLoad } from '@/lib/webdriver'
import { type ScreenshotOptions, type ScreenshotResult } from '@/types/screenshot'

import s3 from './s3'

export async function captureScreenshot({
  url,
  width = DEFAULT_SNAPSHOTS_WIDTH,
  height = DEFAULT_SNAPSHOTS_HEIGHT,
  browser = DEFAULT_SNAPSHOTS_BROWSER as Browser,
  selector = DEFAULT_SNAPSHOTS_SELECTOR,
}: ScreenshotOptions): Promise<ScreenshotResult> {
  // Initialize options for Chrome and Firefox
  const chromeOpts = new chrome.Options()
  const firefoxOpts = new firefox.Options()

  // Set defaults
  chromeOpts.windowSize({ width, height }).addArguments('--headless')
  firefoxOpts.windowSize({ width, height }).addArguments('--headless')

  // Build driver
  const driver = await new Builder()
    .forBrowser(browser.toString())
    .setChromeOptions(chromeOpts)
    .setFirefoxOptions(firefoxOpts)
    .usingServer(SELENIUM_REMOTE_URL)
    .build()

  try {
    await driver.get(url)

    await waitForPageLoad(driver)
    await scrollPageToBottom(driver)
    await waitForNetworkIdle(driver)

    if (selector) {
      await driver.wait(until.elementLocated(By.css(selector)))
    }

    const ss = await driver.takeScreenshot()
    const bytes = Buffer.from(ss, 'base64')

    return {
      buffer: bytes,
      mimetype: 'image/png',
    }
  } finally {
    await driver.quit()
  }
}

export async function uploadScreenshot(buffer: Buffer, key: string, mimeType: string) {
  console.log('Uploading file to', key)
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType,
    }),
  )

  console.log('File uploaded to', key)

  return key
}
