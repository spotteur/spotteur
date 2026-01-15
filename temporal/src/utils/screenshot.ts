import { Builder, Browser, By, until } from 'selenium-webdriver'

import chrome from 'selenium-webdriver/chrome'
import firefox from 'selenium-webdriver/firefox'

import {
  DEFAULT_SNAPSHOTS_HEIGHT,
  DEFAULT_SNAPSHOTS_WIDTH,
  DEFAULT_SNAPSHOTS_BROWSER,
  DEFAULT_SNAPSHOTS_SELECTOR,
} from '../constants/app.ts'
import { SELENIUM_REMOTE_URL } from '../constants/env.ts'
import type { ScreenshotOptions, ScreenshotResult } from '../types/screenshot.ts'

export async function captureScreenshot({
  url,
  width = DEFAULT_SNAPSHOTS_WIDTH,
  height = DEFAULT_SNAPSHOTS_HEIGHT,
  browser = DEFAULT_SNAPSHOTS_BROWSER,
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
    .forBrowser(browser)
    .setChromeOptions(chromeOpts)
    .setFirefoxOptions(firefoxOpts)
    .usingServer(SELENIUM_REMOTE_URL)
    .build()

  try {
    await driver.get(url)

    // Scroll to bottom
    await driver.executeScript('window.scrollTo(0, document.body.scrollHeight)')

    // TODO: How to ensure page is fully loaded before screenshot?
    // Puppeteer code: await page.goto(url, { waitUntil: 'networkidle2' })
    // Try wait for readyState
    await driver.wait(async () => {
      const readyState = await driver.executeScript('return document.readyState')
      return readyState === 'complete'
    }, 30000)

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
