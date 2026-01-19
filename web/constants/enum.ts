export enum Browser {
  chrome = 'chrome',
  firefox = 'firefox',
  edge = 'edge',
}

export const BROWSER_LABEL_MAP: Record<Browser, string> = {
  [Browser.chrome]: 'Chrome',
  [Browser.firefox]: 'Firefox',
  [Browser.edge]: 'Microsoft Edge',
} as const

export const BrowserOptions = Object.values(Browser).map((status) => ({
  value: status,
  label: BROWSER_LABEL_MAP[status],
}))
