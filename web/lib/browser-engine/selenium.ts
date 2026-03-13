import { Builder, By, until, Browser as SeleniumBrowser, type ProxyConfig } from 'selenium-webdriver'
import chrome from 'selenium-webdriver/chrome'
import edge from 'selenium-webdriver/edge'
import firefox from 'selenium-webdriver/firefox'

import { Browser } from '@/constants/enum'
import { SELENIUM_REMOTE_URL } from '@/constants/env'
import { SELENIUM_IMPLICIT_TIMEOUT, SELENIUM_PAGE_LOAD_TIMEOUT, SELENIUM_SCRIPT_TIMEOUT } from '@/constants/selenium'
import { type IBrowserEngine } from '@/types/browser-engine'
import { type SnapshotPayload } from '@/types/screenshot'

export class SeleniumBrowserEngine implements IBrowserEngine {
  protected driver: chrome.Driver | firefox.Driver | edge.Driver

  constructor(driver: chrome.Driver | firefox.Driver | edge.Driver) {
    this.driver = driver
  }

  public async executeScript<T>(script: string): Promise<T> {
    return await this.driver.executeScript<T>(script)
  }

  public async getViewportSize(): Promise<{ width: number; height: number }> {
    const { width, height } = await this.driver.manage().window().getRect()

    return { width, height }
  }

  public async setViewportSize({ width, height }: { width: number; height: number }): Promise<void> {
    await this.driver.manage().window().setRect({ width, height })
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
      window.scrollTo(0, Math.max(document.body.scrollHeight, document.documentElement.scrollHeight))
    })
  }

  public async scrollPageToTop(): Promise<void> {
    await this.driver.executeScript<void>(() => {
      window.scrollTo(0, 0)
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
    await this.driver.wait(until.elementLocated(By.css(selector)), timeout).catch((err) => {
      if (dontThrow) {
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

    // Ref: https://stackoverflow.com/a/52340526
    chromeOpts
      .windowSize(windowSize)
      .addArguments('--headless')
      .addArguments('--no-sandbox') //https://stackoverflow.com/a/50725918/1689770
      .addArguments('--disable-dev-shm-usage') //https://stackoverflow.com/a/50725918/1689770
      .addArguments('--disable-dev-shm-usage') //https://stackoverflow.com/a/50725918/1689770
      .addArguments('--disable-browser-side-navigation') //https://stackoverflow.com/a/49123152/1689770
      .addArguments('--disable-gpu') //https://stackoverflow.com/questions/51959986/how-to-solve-selenium-chromedriver-timed-out-receiving-message-from-renderer-exc

    firefoxOpts.windowSize(windowSize).addArguments('--headless').addArguments('--no-sandbox')
    edgeOpts
      // Edge needs a bit more width to ensure the screenshot width is correct
      .windowSize({ width: windowSize.width + 8, height: windowSize.height })
      .addArguments('--headless')
      .addArguments('--no-sandbox')

    const browser = payload.browser

    const builder = new Builder().usingServer(SELENIUM_REMOTE_URL)

    if (payload.proxy) {
      const proxyUrl = new URL(payload.proxy)
      const hostWithPort = `${proxyUrl.hostname}${proxyUrl.port ? `:${proxyUrl.port}` : ''}`
      const proxyConfig: ProxyConfig = {
        proxyType: 'manual',
        httpProxy: hostWithPort,
        sslProxy: hostWithPort,
        ftpProxy: hostWithPort,
      }

      builder.setProxy(proxyConfig)
    }

    let driver
    if (browser.toString() === Browser.CHROME) {
      driver = (await builder.forBrowser(SeleniumBrowser.CHROME).setChromeOptions(chromeOpts).build()) as chrome.Driver
    } else if (browser.toString() === Browser.FIREFOX) {
      driver = (await builder
        .forBrowser(SeleniumBrowser.FIREFOX)
        .setFirefoxOptions(firefoxOpts)
        .build()) as firefox.Driver
    } else {
      driver = (await builder.forBrowser(SeleniumBrowser.EDGE).setEdgeOptions(edgeOpts).build()) as edge.Driver
    }

    driver.manage().setTimeouts({
      implicit: SELENIUM_IMPLICIT_TIMEOUT,
      pageLoad: SELENIUM_PAGE_LOAD_TIMEOUT,
      script: SELENIUM_SCRIPT_TIMEOUT,
    })

    return new SeleniumBrowserEngine(driver)
  }
}
