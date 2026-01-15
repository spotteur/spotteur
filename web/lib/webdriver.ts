import { type WebDriver } from 'selenium-webdriver'

export async function scrollPageToBottom(driver: WebDriver) {
  return await driver.executeScript<void>('window.scrollTo(0, document.body.scrollHeight)')
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
