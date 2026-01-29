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
    logger.info(`${this.logPrefix} Capturing screenshot of ${this.payload.pageUrl}`)
    try {
      logger.info(`${this.logPrefix} Launching browser engine`)
      this.browserEngine = await BrowserEngineFactory.create(BrowserEngineType.selenium, this.payload)

      logger.info(`${this.logPrefix} Navigating to page URL ${this.payload.pageUrl}`)
      await this.browserEngine.visit(this.payload.pageUrl)

      logger.info(`${this.logPrefix} Waiting for page to completely load`)
      await this.browserEngine.waitForPageLoad(30000)
      await this.browserEngine.fitWindowToContentHeight()
      await this.browserEngine.scrollPageToBottom()
      await this.browserEngine.waitForNetworkIdle(30000)
      await this.browserEngine.waitForSelector(this.payload.selector, 30000)

      const rawVariables = await this.browserEngine.executeScript<unknown>('return window.spotteur || {}')
      this.payload = await mergeGlobalVariablesIntoSnapshotPayload({
        payload: this.payload,
        rawVariables: rawVariables,
      })

      await this.runPreScreenshotHook()

      logger.info(`${this.logPrefix} Capturing screenshot`)
      const buffer = await this.browserEngine.takeScreenshot()
      // TODO: Maybe we can take screenshot multiple times to ensure consistent results.
      // If the result is consistent, we can take its as a final screenshot.
      // Otherwise, we can retry until X times, and throws if its still not consistent.

      const tempPath = path.join(STORAGE_FOLDER, `${this.payload.id}-${this.payload.browser.toString()}.png`)
      fs.writeFileSync(tempPath, buffer)

      logger.info(`${this.logPrefix} Screenshot captured, saved to: ${tempPath}`)
      return { tempPath }
    } finally {
      logger.info(`${this.logPrefix} Closing browser engine`)
      await this.browserEngine?.quit()
    }
  }

  private async runPreScreenshotHook(): Promise<void> {
    if (this.payload.hooks?.['pre-screenshot']) {
      logger.info(`${this.logPrefix} Executing pre-screenshot hook`)
      await this.browserEngine?.executeScript<void>(this.payload.hooks['pre-screenshot'])
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
