import { chromium, type Browser as PlaywrightBrowser, type Page, firefox } from 'playwright-core'

import { Browser } from '@/constants/enum'
import { PLAYWRIGHT_CHROME_URL, PLAYWRIGHT_EDGE_URL, PLAYWRIGHT_FIREFOX_URL } from '@/constants/env'
import { UnsupportedBrowserTypeError } from '@/lib/browser-engine'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type SnapshotPayload } from '@/types/screenshot'

export class PlaywrightBrowserEngine implements IBrowserEngine {
  protected page: Page
  protected browser: PlaywrightBrowser

  constructor(browser: PlaywrightBrowser, page: Page) {
    this.browser = browser
    this.page = page
  }

  public async enableReducedMotion(): Promise<void> {
    await this.page.emulateMedia({ reducedMotion: 'reduce' })
  }

  public async executeScript<T>(script: string): Promise<T> {
    // return await this.page.evaluate<T>(script)
    return await this.page.evaluate<T>(new Function(`"use strict"; ${script}`) as () => T)
  }

  public async fitWindowToContentHeight(): Promise<void> {
    const width = this.page.viewportSize()?.width

    // Here we are adding extra 20% height to handle any fixed elements
    await this.page.setViewportSize({
      width: width || 1280,
      height: await this.page.evaluate(() =>
        Math.ceil(Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)),
      ),
    })
  }

  public async hideElements(selector: string): Promise<void> {
    await this.page.evaluate((sel: string) => {
      const elements = document.querySelectorAll(sel)
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('visibility', 'hidden', 'important')
        }
      })
    }, selector)
  }

  public async quit(): Promise<void> {
    await this.browser.close()
  }

  public async takeScreenshot(): Promise<Buffer> {
    const buffer = await this.page.screenshot({ fullPage: true })
    return buffer
  }

  public async removeElements(selector: string): Promise<void> {
    await this.page.evaluate((sel: string) => {
      const elements = document.querySelectorAll(sel)
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('display', 'none', 'important')
        }
      })
    }, selector)
  }

  public async replaceElementInnerText(selector: string, text: string): Promise<void> {
    await this.page.evaluate(
      ({ selector, text }: { selector: string; text: string }) => {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el) => {
          if (el instanceof HTMLElement) {
            el.innerText = text
          }
        })
      },
      { selector, text },
    )
  }

  public async resetTimeBasedMedia(): Promise<void> {
    await this.page.evaluate(() => {
      const mediaElements = document.querySelectorAll('video, audio')
      mediaElements.forEach(async (el) => {
        if (el instanceof HTMLMediaElement) {
          el.addEventListener('seeked', (event) => {
            if (event.target instanceof HTMLMediaElement) {
              event.target.pause()
            }
          })
          el.addEventListener('play', (event) => {
            if (event.target instanceof HTMLMediaElement) {
              event.target.pause()
            }
          })
          el.currentTime = 0
        }
      })
    })
  }

  public async scrollPageToBottom(): Promise<void> {
    await this.page.evaluate(() =>
      window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)),
    )
  }

  public async scrollPageToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0))
  }

  public async sleep(timeout: number): Promise<void> {
    await this.page.waitForTimeout(timeout)
  }

  public async visit(url: string): Promise<void> {
    await this.page.goto(url)
  }

  public async waitForNetworkIdle(timeout: number): Promise<void> {
    await this.page.waitForLoadState('networkidle', { timeout })
  }

  public async waitForPageLoad(timeout: number): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded', { timeout })
  }

  public async waitForSelector(selector: string, timeout?: number): Promise<void> {
    await this.page.waitForSelector(selector, { timeout })
  }
}

export class PlaywrightBrowserEngineFactory {
  static async create(payload: SnapshotPayload): Promise<PlaywrightBrowserEngine> {
    const browserType = payload.browser.toString()
    let browser
    if (browserType === Browser.FIREFOX) {
      browser = await firefox.connect(PLAYWRIGHT_FIREFOX_URL)
    } else if (browserType === Browser.CHROME) {
      browser = await chromium.connect(PLAYWRIGHT_CHROME_URL)
    } else if (browserType === Browser.EDGE) {
      browser = await chromium.connect(PLAYWRIGHT_EDGE_URL)
    } else {
      throw new UnsupportedBrowserTypeError(browserType)
    }

    const browserContext = await browser.newContext({
      viewport: {
        width: payload.viewportWidth,
        height: payload.viewportHeight,
      },
    })
    const page = await browserContext.newPage()

    return new PlaywrightBrowserEngine(browser, page)
  }
}
