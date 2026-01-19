import { PutObjectCommand } from '@aws-sdk/client-s3'
import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import edge from 'selenium-webdriver/edge'
import firefox from 'selenium-webdriver/firefox'

import {
  DEFAULT_SNAPSHOTS_HEIGHT,
  DEFAULT_SNAPSHOTS_WIDTH,
  DEFAULT_SNAPSHOTS_BROWSER,
  DEFAULT_SNAPSHOTS_SELECTOR,
} from '@/constants/app'
import { Browser } from '@/constants/enum'
import { S3_BUCKET, SELENIUM_REMOTE_URL } from '@/constants/env'
import { scrollPageToBottom, setViewportBaseOnFullPage, waitForNetworkIdle, waitForPageLoad } from '@/lib/webdriver'
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
  const edgeOpts = new edge.Options()

  // Set defaults
  chromeOpts.windowSize({ width, height }).addArguments('--headless')
  firefoxOpts.windowSize({ width, height }).addArguments('--headless')
  edgeOpts.windowSize({ width, height }).addArguments('--headless')

  // Build driver
  let driver: chrome.Driver | firefox.Driver | edge.Driver
  if (browser.toString() === Browser.chrome) {
    driver = (await new Builder()
      .forBrowser(browser.toString())
      .setChromeOptions(chromeOpts)
      .usingServer(SELENIUM_REMOTE_URL)
      .build()) as chrome.Driver
  } else if (browser.toString() === Browser.firefox) {
    driver = (await new Builder()
      .forBrowser(browser.toString())
      .setFirefoxOptions(firefoxOpts)
      .usingServer(SELENIUM_REMOTE_URL)
      .build()) as firefox.Driver
  } else {
    driver = (await new Builder()
      .forBrowser(browser.toString())
      .setEdgeOptions(edgeOpts)
      .usingServer(SELENIUM_REMOTE_URL)
      .build()) as edge.Driver
  }

  try {
    await driver.get(url)

    await waitForPageLoad(driver)
    await scrollPageToBottom(driver)
    await waitForNetworkIdle(driver)

    if (selector) {
      await driver.wait(until.elementLocated(By.css(selector)))
    }

    await setViewportBaseOnFullPage(driver)

    const ss = driver instanceof firefox.Driver ? await driver.takeFullPageScreenshot() : await driver.takeScreenshot()
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
