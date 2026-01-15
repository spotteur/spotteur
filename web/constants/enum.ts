export enum Browser {
  chrome = 'chrome',
  firefox = 'firefox',
  safari = 'safari',
  edge = 'edge',
}

export const BROWSER_LABEL_MAP: Record<Browser, string> = {
  [Browser.chrome]: 'Chrome',
  [Browser.firefox]: 'Firefox',
  [Browser.safari]: 'Safari',
  [Browser.edge]: 'Microsoft Edge',
} as const

export const BrowserOptions = Object.values(Browser).map((status) => ({
  value: status,
  label: BROWSER_LABEL_MAP[status],
}))
