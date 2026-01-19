import { type WebDriver } from 'selenium-webdriver'

export async function scrollPageToBottom(driver: WebDriver) {
  await driver.executeAsyncScript<void>(`
    const viewportHeight = window.innerHeight;
    const scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 300;
    let totalHeight = 0;

    const timer = setInterval(() => {
      window.scrollBy(0, viewportHeight);
      totalHeight += viewportHeight;

      if (totalHeight >= scrollHeight){
        clearInterval(timer);
      }
    }, 2500);
  `)
}

export async function waitForPageLoad(driver: WebDriver, timeout = 30000) {
  return await driver.wait(async () => {
    const readyState = await driver.executeScript<string>('return document.readyState')
    return readyState === 'complete'
  }, timeout)
}

export async function waitForNetworkIdle(driver: WebDriver, timeout = 30000, interval = 1000) {
  const maxChecks = Math.ceil(timeout / interval)
  let checks = 0

  while (checks < maxChecks) {
    const activeRequests = await driver.executeScript<number>(`
      return window.performance.getEntriesByType('resource')
        .filter(entry => !entry.responseEnd)
        .length;
    `)

    if (activeRequests === 0) {
      return true
    }

    await new Promise((resolve) => setTimeout(resolve, interval))
    checks++
  }

  return false
}

export async function setViewportBaseOnFullPage(driver: WebDriver) {
  const { width } = await driver.manage().window().getRect()
  const { fullPageHeight } = await driver.executeScript<{ fullPageHeight: number }>(`
    return {
      fullPageHeight: Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) + 300
    };
  `)

  await driver.manage().window().setRect({ width: width, height: fullPageHeight })
}
