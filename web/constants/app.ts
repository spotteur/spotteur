export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

export const BrowserLists = [
  {
    id: 'chrome',
    label: 'Chrome',
  },
  {
    id: 'firefox',
    label: 'Firefox',
  },
  {
    id: 'edge',
    label: 'Edge',
  },
]

export const AttributeWithValueLists = ['data-spt-replace-words', 'data-spt-custom'] as const
export const AttributeWithTrueValue = ['data-spt-hide', 'data-spt-remove'] as const
export const AttributesLists = [...AttributeWithTrueValue, ...AttributeWithValueLists] as const
