import { SeleniumBrowserEngineFactory } from '@/lib/browser-engine/selenium'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type SnapshotPayload } from '@/types/screenshot'

export enum BrowserEngineType {
  selenium = 'selenium',
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
    if (engineType === BrowserEngineType.selenium) {
      return SeleniumBrowserEngineFactory.create(payload)
    }

    throw new UnsupportedBrowserEngineError(engineType)
  }
}
