import { Builder, By, until } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import edge from 'selenium-webdriver/edge'
import firefox from 'selenium-webdriver/firefox'

import { Browser } from '@/constants/enum'
import { SELENIUM_REMOTE_URL } from '@/constants/env'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type SnapshotPayload } from '@/types/screenshot'

export class SeleniumBrowserEngine implements IBrowserEngine {
  private driver: chrome.Driver | firefox.Driver | edge.Driver

  constructor(driver: chrome.Driver | firefox.Driver | edge.Driver) {
    this.driver = driver
  }

  public async executeScript<T>(script: string): Promise<T> {
    return await this.driver.executeScript<T>(script)
  }

  public async fitWindowToContentHeight(): Promise<void> {
    const { width } = await this.driver.manage().window().getRect()
    // Here we are adding extra 20% height to handle any fixed elements
    const fullPageHeight = await this.driver.executeScript<number>(() => {
      return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * 1.2
    })

    await this.driver.manage().window().setRect({ width: width, height: fullPageHeight })
  }

  public async hideElements(selector: string): Promise<void> {
    await this.waitForSelector(selector, 5000, true)
    await this.driver.executeScript<void>(`
      const elements = document.querySelectorAll(\`${selector}\`);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('visibility', 'hidden', 'important')
        }
      });
    `)
  }

  public async quit(): Promise<void> {
    await this.driver.quit()
  }

  public async takeScreenshot(): Promise<Buffer> {
    const ss =
      this.driver instanceof firefox.Driver
        ? await this.driver.takeFullPageScreenshot()
        : await this.driver.takeScreenshot()

    return Buffer.from(ss, 'base64')
  }

  public async removeElements(selector: string): Promise<void> {
    await this.waitForSelector(selector, 5000, true)
    await this.driver.executeScript<void>(`
      const elements = document.querySelectorAll(\`${selector}\`)
      elements.forEach((el) => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('display', 'none', 'important')
        }
      })
    `)
  }

  public async replaceElementInnerText(selector: string, text: string): Promise<void> {
    await this.waitForSelector(selector, 5000, true)
    await this.driver.executeScript<void>(`
      const elements = document.querySelectorAll(\`${selector}\`);
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.innerText = \`${text}\`;
        }
      });
    `)
  }

  public async resetTimeBasedMedia(): Promise<void> {
    await this.driver.executeScript<void>(`
      const elements = document.querySelectorAll('video, audio');
      elements.forEach(el => {
        if (el instanceof HTMLElement) {
          el.style.setProperty('visibility', 'hidden', 'important')
        }
      });
    `)
  }

  public async scrollPageToBottom(): Promise<void> {
    await this.driver.executeScript<void>(() => {
      window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) * 1.2)
    })
  }

  public async enableReducedMotion(): Promise<void> {
    await this.driver.executeScript<void>(() => {
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
      document.head.appendChild(style)
    })
  }

  public async sleep(timeout: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, timeout))
  }

  public async visit(url: string): Promise<void> {
    await this.driver.get(url)
  }

  public async waitForNetworkIdle(timeout: number): Promise<void> {
    const interval = 1000
    const maxChecks = Math.ceil(timeout / interval)
    let checks = 0

    while (checks < maxChecks) {
      const activeRequests = await this.driver.executeScript<number>(() => {
        return window.performance
          .getEntriesByType('resource')
          .filter((entry) => entry instanceof PerformanceResourceTiming && !entry.responseEnd).length
      })

      if (activeRequests === 0) {
        return
      }

      await this.sleep(interval)

      checks++
    }

    return
  }

  public async waitForPageLoad(timeout: number): Promise<void> {
    await this.driver.wait(async () => {
      return await this.driver.executeScript<boolean>(() => document.readyState === 'complete')
    }, timeout)
  }

  public async waitForSelector(selector: string, timeout: number, dontThrow?: boolean): Promise<void> {
    console.log(`Waiting for selector: ${selector}`)
    await this.driver.wait(until.elementLocated(By.css(selector)), timeout).catch((err) => {
      if (dontThrow) {
        console.warn(`Selector ${selector} not found within ${timeout} ms, but continuing as dontThrow is set.`)
        return
      }

      throw err
    })
  }
}

export class SeleniumBrowserEngineFactory {
  static async create(payload: SnapshotPayload): Promise<SeleniumBrowserEngine> {
    const windowSize = { width: payload.viewportWidth, height: payload.viewportHeight }

    const chromeOpts = new chrome.Options()
    const firefoxOpts = new firefox.Options()
    const edgeOpts = new edge.Options()

    chromeOpts.windowSize(windowSize).addArguments('--headless')
    firefoxOpts.windowSize(windowSize).addArguments('--headless')
    edgeOpts.windowSize(windowSize).addArguments('--headless')

    const browser = payload.browser

    const builder = new Builder()
      .forBrowser(browser.toString())
      .setChromeOptions(chromeOpts)
      .setFirefoxOptions(firefoxOpts)
      .setEdgeOptions(edgeOpts)
      .usingServer(SELENIUM_REMOTE_URL)

    let driver
    if (browser.toString() === Browser.chrome) {
      driver = (await builder.build()) as chrome.Driver
    } else if (browser.toString() === Browser.firefox) {
      driver = (await builder.build()) as firefox.Driver
    } else {
      driver = (await builder.build()) as edge.Driver
    }

    driver.manage().setTimeouts({ implicit: 10000, pageLoad: 30000, script: 60000 })

    return new SeleniumBrowserEngine(driver)
  }
}
