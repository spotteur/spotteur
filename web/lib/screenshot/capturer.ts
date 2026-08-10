import * as fs from 'node:fs'
import path from 'node:path'

import sharp from 'sharp'

import { DEFAULT_SNAPSHOTS_HEIGHT, STORAGE_FOLDER } from '@/constants/app'
import { RuleAttrType } from '@/constants/enum'
import { mergeGlobalVariablesIntoSnapshotPayload } from '@/features/builds/actions'
import { getLoremIpsumWords } from '@/lib/lipsum'
import { logger } from '@/lib/logger'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type CaptureScreenshotParams, type SnapshotPayload } from '@/types/screenshot'

export class ScreenshotCapturer {
  private browserEngine: IBrowserEngine | undefined
  private payload: SnapshotPayload
  private heartbeat: (details?: unknown) => Promise<void>

  constructor(params: CaptureScreenshotParams) {
    this.browserEngine = params.browserEngine
    this.payload = params.payload
    this.heartbeat = params.heartbeat || (() => Promise.resolve())
  }

  public async capture(): Promise<{ tempPath: string }> {
    if (
      this.payload.cookieSetting &&
      this.payload.cookieSetting.name &&
      this.payload.cookieSetting.domain &&
      this.payload.cookieSetting.value
    ) {
      await this.heartbeat({ message: `Configuring cookie settings` })
      await this.browser().addCookie({
        name: this.payload.cookieSetting.name,
        value: this.payload.cookieSetting.value,
        domain: this.payload.cookieSetting.domain,
        secure: this.payload.cookieSetting.secure || false,
      })
    }

    await this.heartbeat({ message: `Navigating to page URL ${this.payload.pageUrl}` })
    await this.browser().visit(this.payload.pageUrl)

    await this.heartbeat({ message: `Waiting for page to completely load` })
    await this.browser().waitForPageLoad(30000)

    const rawVariables = await this.browser().executeScript<unknown>('return window.spotteur || {}')
    this.payload = await mergeGlobalVariablesIntoSnapshotPayload({
      payload: this.payload,
      rawVariables,
    })

    await this.runAfterPageLoadHook()
    await this.hideScrollbars()

    await this.browser().scrollPageToBottom()
    await this.browser().scrollPageToTop()
    await this.fitWindowToContentHeight()

    await this.browser().waitForNetworkIdle(30000)
    await this.browser().waitForSelector(this.payload.selector, 30000)

    await this.runBeforeScreenshotHook()

    // If the hooks made any changes that causing layout shifts, this will help to stabilize it
    await this.browser().scrollPageToBottom()
    await this.browser().scrollPageToTop()
    await this.fitWindowToContentHeight()

    await this.heartbeat({ message: `Capturing screenshot` })
    const buffer = await this.takeConsistentScreenshot({
      maxAttempts: 5,
      delayMs: 3000,
      consistentCount: 3,
    })

    const compressed = await sharp(buffer)
      .raw()
      .removeAlpha()
      .png({
        compressionLevel: 9,
        quality: 90,
      })
      .toFormat('png')
      .toBuffer()

    if (!fs.existsSync(STORAGE_FOLDER)) {
      fs.mkdirSync(STORAGE_FOLDER, { recursive: true })
    }
    const tempPath = path.join(STORAGE_FOLDER, `${this.payload.id}-${this.payload.browser.toString()}.png`)
    fs.writeFileSync(tempPath, compressed)
    await this.heartbeat({ message: `Screenshot saved to: ${tempPath} (${compressed.length / 1024} kB)` })
    return { tempPath }
  }

  private async takeConsistentScreenshot({
    maxAttempts,
    delayMs,
    consistentCount,
  }: {
    maxAttempts: number
    delayMs: number
    consistentCount: number
  }): Promise<Buffer> {
    const screenshots: Buffer[] = []
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await this.heartbeat({ message: `Taking screenshot attempt ${attempt}/${maxAttempts}` })
      const buffer = await this.browser().takeScreenshot()
      if (!buffer) {
        logger.error(`Failed to capture screenshot on attempt ${attempt}`, { payload: this.payload })
        throw new Error('Failed to capture screenshot')
      }

      await this.heartbeat({ message: `Screenshot captured, size: ${buffer.length / 1024} kB` })
      const image = sharp(buffer)
      const info = await image.metadata()
      if (info.width !== this.payload.viewportWidth) {
        throw new Error(
          `Screenshot width (${info.width}px) doesn't match expected viewport width (${this.payload.viewportWidth}px)`,
        )
      }

      screenshots.push(buffer)

      // Need more screenshots before checking consistency
      if (screenshots.length < consistentCount) {
        await this.browser().sleep(delayMs)
        continue
      }

      // Check if last N screenshots are consistent
      if (this.areScreenshotsConsistent(screenshots, consistentCount)) {
        await this.heartbeat({ message: `Screenshot are consistent in the last ${consistentCount} attempts` })
        return screenshots[screenshots.length - 1]
      }

      // Not consistent yet, wait before next attempt
      await this.heartbeat({ message: `Screenshot give different result, waiting ${delayMs}ms before retry` })
      if (attempt < maxAttempts) {
        await this.browser().sleep(delayMs)
      }
    }

    // Return last screenshot if we couldn't achieve consistency
    await this.heartbeat({
      message: `Unable to capture consistent screenshot after ${maxAttempts} attempts, last captured screenshot used`,
    })

    return screenshots[screenshots.length - 1]
  }

  private areScreenshotsConsistent(screenshots: Buffer[], count: number): boolean {
    // Take the last N screenshots
    const lastNScreenshots = screenshots.slice(-count)
    const firstScreenshot = lastNScreenshots[0]

    return lastNScreenshots.every(
      // Make sure all screenshots are identical, by verifying buffer size and buffer content
      (screenshot) => screenshot.length === firstScreenshot.length && screenshot.equals(firstScreenshot),
    )
  }

  private async runAfterPageLoadHook(): Promise<void> {
    if (this.payload.globalHooks?.['after-page-load']) {
      await this.heartbeat({ message: `Executing global after-page-load hook` })
      await this.browser().executeScript<void>(this.payload.globalHooks['after-page-load'])
    }

    if (this.payload.hooks?.['after-page-load']) {
      await this.heartbeat({ message: `Executing after-page-load hook` })
      await this.browser().executeScript<void>(this.payload.hooks['after-page-load'])
    }
  }

  private async hideScrollbars(): Promise<void> {
    await this.browser().executeScript<void>(`
      const style = document.createElement('style')
      style.type = 'text/css'
      style.id = 'spotteur-hide-scrollbars-style'
      style.appendChild(
        document.createTextNode(\`
          * {
            scrollbar-width: none !important; /* Firefox */
            -ms-overflow-style: none !important; /* Edge */
          }
          *::-webkit-scrollbar {
            display: none !important; /* Chrome */
          }
        \`),
      )
      document.head.appendChild(style)
    `)
  }

  private async fitWindowToContentHeight(): Promise<void> {
    const { width, height } = await this.browser().getViewportSize()
    await this.heartbeat({ message: `Viewport size before fitting: ${width}x${height}` })

    // First set viewport height to the default to get accurate content height
    await this.browser().setViewportSize({ width, height: DEFAULT_SNAPSHOTS_HEIGHT })

    // Find out all height values from the page to determine full content height
    const metrics = await this.browser().executeScript<{
      innerHeight: number
      outerHeight: number
      bodyScrollHeight: number
      bodyOffsetHeight: number
      htmlClientHeight: number
      htmlScrollHeight: number
      htmlOffsetHeight: number
    }>(`return {
        innerHeight: window.innerHeight,
        outerHeight: window.outerHeight,
        bodyScrollHeight: document.body.scrollHeight,
        bodyOffsetHeight: document.body.offsetHeight,
        htmlClientHeight: document.documentElement.clientHeight,
        htmlScrollHeight: document.documentElement.scrollHeight,
        htmlOffsetHeight: document.documentElement.offsetHeight,
    }`)
    await this.heartbeat({ message: `Browser metrics: ${JSON.stringify(metrics)}` })

    let fullPageHeight = Math.max(
      metrics.bodyScrollHeight,
      metrics.bodyOffsetHeight,
      metrics.htmlClientHeight,
      metrics.htmlScrollHeight,
      metrics.htmlOffsetHeight,
    )

    if (metrics.outerHeight < metrics.innerHeight) {
      throw new Error('Unexpected browser metrics, unable to determine full page height')
    }

    const decorationsHeight = metrics.outerHeight - metrics.innerHeight
    fullPageHeight += decorationsHeight

    await this.heartbeat({ message: `Viewport size after fitting: ${width}x${fullPageHeight}` })
    await this.browser().setViewportSize({ width, height: fullPageHeight })
  }

  private async runBeforeScreenshotHook(): Promise<void> {
    if (this.payload.globalHooks?.['before-screenshot']) {
      await this.heartbeat({ message: `Executing global before-screenshot hook` })
      await this.browser().executeScript<void>(this.payload.globalHooks['before-screenshot'])
    }

    if (this.payload.hooks?.['before-screenshot']) {
      await this.heartbeat({ message: `Executing before-screenshot hook` })
      await this.browser().executeScript<void>(this.payload.hooks['before-screenshot'])
    }

    if (this.payload.reducedMotion) {
      await this.heartbeat({ message: `Enabling reduced motion` })
      await this.browser().enableReducedMotion()
    }

    if (this.payload.mediaReset) {
      await this.heartbeat({ message: `Resetting time-based media` })
      await this.browser().resetTimeBasedMedia()
    }

    await this.applyRules()
  }

  private async applyRules(): Promise<void> {
    for (const rule of this.payload.rules || []) {
      for (const selector of rule.selectors) {
        for (const ruleAttr of rule.attrs) {
          if (ruleAttr.name === RuleAttrType.REMOVE) {
            await this.heartbeat({ message: `Removing element matching selector: ${selector}` })
            await this.browser().removeElements(selector)
          }

          if (ruleAttr.name === RuleAttrType.HIDE) {
            await this.heartbeat({ message: `Hiding element matching selector: ${selector}` })
            await this.browser().hideElements(selector)
          }

          if (ruleAttr.name === RuleAttrType.CUSTOM) {
            await this.heartbeat({
              message: `Replace innerText element with user-defined text matching selector: ${selector}`,
            })
            await this.browser().replaceElementInnerText(selector, ruleAttr.value || '')
          }

          if (ruleAttr.name === RuleAttrType.REPLACE_WORDS) {
            await this.heartbeat({
              message: `Replace innerText element with static text matching selector: ${selector}`,
            })
            await this.browser().replaceElementInnerText(selector, getLoremIpsumWords(Number(ruleAttr.value)))
          }

          if (ruleAttr.name === RuleAttrType.IMAGE_COLOR_BLACK) {
            await this.heartbeat({ message: `Change image color to black for elements matching selector: ${selector}` })
            await this.browserEngine?.executeScript<void>(`
              const elements = document.querySelectorAll(\`${selector}\`);
              elements.forEach(el => {
                if (el instanceof HTMLImageElement) {
                  el.style.filter = 'brightness(0)';
                }
              });
            `)
          }

          if (ruleAttr.name === RuleAttrType.IMAGE_COLOR_WHITE) {
            await this.heartbeat({ message: `Change image color to white for elements matching selector: ${selector}` })
            await this.browserEngine?.executeScript<void>(`
              const elements = document.querySelectorAll(\`${selector}\`);
              elements.forEach(el => {
                if (el instanceof HTMLImageElement) {
                  el.style.filter = 'brightness(0) invert(1)';
                }
              });
            `)
          }
        }
      }
    }
  }

  private browser(): IBrowserEngine {
    if (!this.browserEngine) {
      logger.error(`Browser engine is not initialized yet`, { payload: this.payload })
      throw new Error('Browser engine not initialized yet')
    }

    return this.browserEngine
  }
}
