import { chromium, firefox } from 'playwright-core'

import { Browser } from '@/constants/enum'
import { BROWSERLESS_TOKEN, BROWSERLESS_WS_ENDPOINT } from '@/constants/env'
import { UnsupportedBrowserTypeError } from '@/lib/browser-engine'
import { PlaywrightBrowserEngine, PlaywrightBrowserEngineFactory } from '@/lib/browser-engine/playwright'
import { type SnapshotPayload } from '@/types/screenshot'

export class BrowserlessBrowserEngine extends PlaywrightBrowserEngine {}

export class BrowserlessBrowserEngineFactory {
  static async create(payload: SnapshotPayload): Promise<BrowserlessBrowserEngine> {
    const browserType = payload.browser.toString()
    let browser
    if (browserType === Browser.FIREFOX) {
      browser = await firefox.connect(`${BROWSERLESS_WS_ENDPOINT}/firefox/playwright?token=${BROWSERLESS_TOKEN}`)
    } else if (browserType === Browser.CHROME) {
      browser = await chromium.connectOverCDP(`${BROWSERLESS_WS_ENDPOINT}/chrome?token=${BROWSERLESS_TOKEN}`)
    } else {
      throw new UnsupportedBrowserTypeError(browserType)
    }

    const browserContext = await PlaywrightBrowserEngineFactory.createBrowserContext(browser, payload)
    const page = await browserContext.newPage()

    return new BrowserlessBrowserEngine(browser, page)
  }
}
