import { BrowserlessBrowserEngineFactory } from '@/lib/browser-engine/browserless'
import { PlaywrightBrowserEngineFactory } from '@/lib/browser-engine/playwright'
import { SeleniumBrowserEngineFactory } from '@/lib/browser-engine/selenium'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type SnapshotPayload } from '@/types/screenshot'

export enum BrowserEngineType {
  SELENIUM = 'selenium',
  PLAYWRIGHT = 'playwright',
  BROWSERLESS = 'browserless',
}

export class UnsupportedBrowserTypeError extends Error {
  constructor(browserType: string) {
    super(`Unsupported browser type: ${browserType}`)
    this.name = 'UnsupportedBrowserTypeError'
  }
}

export class UnsupportedBrowserTypeError extends Error {
  constructor(browserType: string) {
    super(`Unsupported browser type: ${browserType}`)
    this.name = 'UnsupportedBrowserTypeError'
  }
}

export class UnsupportedBrowserEngineError extends Error {
  constructor(engineType: string) {
    super(`Unsupported browser engine: ${engineType}`)
    this.name = 'UnsupportedBrowserEngineError'
  }
}

export class BrowserEngineFactory {
  static async create(engineType: string, payload: SnapshotPayload): Promise<IBrowserEngine> {
    if (engineType === BrowserEngineType.SELENIUM) {
      return SeleniumBrowserEngineFactory.create(payload)
    }

    if (engineType === BrowserEngineType.PLAYWRIGHT) {
      return PlaywrightBrowserEngineFactory.create(payload)
    }

    if (engineType === BrowserEngineType.BROWSERLESS) {
      return BrowserlessBrowserEngineFactory.create(payload)
    }

    throw new UnsupportedBrowserEngineError(engineType)
  }
}
