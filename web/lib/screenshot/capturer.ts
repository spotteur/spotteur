import * as fs from 'node:fs'
import path from 'node:path'

import { STORAGE_FOLDER } from '@/constants/app'
import { RuleAttrType } from '@/constants/enum'
import { mergeGlobalVariablesIntoSnapshotPayload } from '@/features/builds/actions'
import { BrowserEngineFactory, BrowserEngineType } from '@/lib/browser-engine'
import { getLoremIpsumWords } from '@/lib/lipsum'
import { logger } from '@/lib/logger'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type CaptureScreenshotParams, type SnapshotPayload } from '@/types/screenshot'

export class ScreenshotCapturer {
  private browserEngine: IBrowserEngine | undefined
  private payload: SnapshotPayload
  private logPrefix: string

  constructor(params: CaptureScreenshotParams) {
    this.payload = params.payload
    this.logPrefix = params.logPrefix
  }

  public async capture(): Promise<{ tempPath: string }> {
    try {
      logger.info(`${this.logPrefix} Launching browser engine`)
      this.browserEngine = await BrowserEngineFactory.create(BrowserEngineType.selenium, this.payload)

      logger.info(`${this.logPrefix} Navigating to page URL ${this.payload.pageUrl}`)
      await this.browserEngine.visit(this.payload.pageUrl)

      logger.info(`${this.logPrefix} Waiting for page to completely load`)
      await this.browserEngine.waitForPageLoad(30000)

      const rawVariables = await this.browserEngine.executeScript<unknown>('return window.spotteur || {}')
      this.payload = await mergeGlobalVariablesIntoSnapshotPayload({
        payload: this.payload,
        rawVariables,
      })

      await this.runAfterPageLoadHook()

      await this.browserEngine.scrollPageToBottom()
      await this.browserEngine.scrollPageToTop()
      await this.browserEngine.fitWindowToContentHeight()

      await this.browserEngine.waitForNetworkIdle(30000)
      await this.browserEngine.waitForSelector(this.payload.selector, 30000)

      await this.runBeforeScreenshotHook()

      await this.browserEngine.scrollPageToBottom()
      await this.browserEngine.scrollPageToTop()

      logger.info(`${this.logPrefix} Capturing screenshot`)
      const buffer = await this.takeConsistentScreenshot({
        maxAttempts: 5,
        delayMs: 3000,
        consistentCount: 3,
      })

      const tempPath = path.join(STORAGE_FOLDER, `${this.payload.id}-${this.payload.browser.toString()}.png`)
      fs.writeFileSync(tempPath, buffer)

      logger.info(`${this.logPrefix} Screenshot captured, saved to: ${tempPath}`)
      return { tempPath }
    } finally {
      logger.info(`${this.logPrefix} Closing browser engine`)
      await this.browserEngine?.quit()
    }
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
      logger.info(`${this.logPrefix} Taking screenshot attempt ${attempt}/${maxAttempts}`)
      const buffer = await this.browserEngine?.takeScreenshot()
      if (!buffer) {
        throw new Error('Failed to capture screenshot')
      }

      screenshots.push(buffer)

      if (screenshots.length >= consistentCount) {
        const lastScreenshots = screenshots.slice(-consistentCount)
        const allConsistent = lastScreenshots.every((screenshot) => {
          const first = lastScreenshots[0]
          return screenshot.length === first.length && screenshot.equals(first)
        })

        if (allConsistent) {
          logger.info(`${this.logPrefix} Screenshot are consistent in the last ${consistentCount} attempts`)
          return lastScreenshots[lastScreenshots.length - 1]
        } else {
          logger.info(`${this.logPrefix} Screenshot give different result, waiting ${delayMs}ms before retry`)
          if (attempt < maxAttempts) {
            await this.browserEngine?.sleep(delayMs)
          }
        }
      } else {
        await this.browserEngine?.sleep(delayMs)
      }
    }

    const lastScreenshot = screenshots.pop()
    if (!lastScreenshot) {
      throw new Error('Failed to capture screenshot')
    }

    logger.info(
      `${this.logPrefix} Unable to capture consistent screenshot after ${maxAttempts} attempts, last captured screenshot used`,
    )
    return lastScreenshot
  }

  private async runAfterPageLoadHook(): Promise<void> {
    if (this.payload.hooks?.['after-page-load']) {
      logger.info(`${this.logPrefix} Executing after-page-load hook`)
      await this.browserEngine?.executeScript<void>(this.payload.hooks['after-page-load'])
    }
  }

  private async runBeforeScreenshotHook(): Promise<void> {
    if (this.payload.hooks?.['before-screenshot']) {
      logger.info(`${this.logPrefix} Executing before-screenshot hook`)
      await this.browserEngine?.executeScript<void>(this.payload.hooks['before-screenshot'])
    }

    if (this.payload.reducedMotion) {
      logger.info(`${this.logPrefix} Enabling reduced motion`)
      await this.browserEngine?.enableReducedMotion()
    }

    if (this.payload.mediaReset) {
      logger.info(`${this.logPrefix} Resetting time-based media`)
      await this.browserEngine?.resetTimeBasedMedia()
    }

    await this.applyRules()
  }

  private async applyRules(): Promise<void> {
    for (const rule of this.payload.rules || []) {
      for (const selector of rule.selectors) {
        for (const ruleAttr of rule.attrs) {
          if (ruleAttr.name === RuleAttrType.REMOVE) {
            logger.info(`${this.logPrefix} Removing element matching selector: ${selector}`)
            await this.browserEngine?.removeElements(selector)
          }

          if (ruleAttr.name === RuleAttrType.HIDE) {
            logger.info(`${this.logPrefix} Hiding element matching selector: ${selector}`)
            await this.browserEngine?.hideElements(selector)
          }

          if (ruleAttr.name === RuleAttrType.CUSTOM) {
            logger.info(
              `${this.logPrefix} Replace innerText element with user-defined text matching selector: ${selector}`,
            )
            await this.browserEngine?.replaceElementInnerText(selector, ruleAttr.value || '')
          }

          if (ruleAttr.name === RuleAttrType.REPLACE_WORDS) {
            logger.info(`${this.logPrefix} Replace innerText element with static text matching selector: ${selector}`)
            await this.browserEngine?.replaceElementInnerText(selector, getLoremIpsumWords(Number(ruleAttr.value)))
          }
        }
      }
    }
  }
}
