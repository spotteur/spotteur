export enum Browser {
  CHROME = 'chrome',
  FIREFOX = 'firefox',
  EDGE = 'edge',
}

export const BROWSER_LABEL_MAP: Record<Browser, string> = {
  [Browser.CHROME]: 'Chrome',
  [Browser.FIREFOX]: 'Firefox',
  [Browser.EDGE]: 'Microsoft Edge',
} as const

export const BROWSER_OPTIONS = Object.values(Browser).map((status) => ({
  value: status,
  label: BROWSER_LABEL_MAP[status],
}))

export enum RuleAttrType {
  HIDE = 'data-spt-hide',
  REMOVE = 'data-spt-remove',
  REPLACE_WORDS = 'data-spt-replace-words',
  CUSTOM = 'data-spt-custom',
  IMAGE_COLOR_WHITE = 'data-spt-image-color-white',
  IMAGE_COLOR_BLACK = 'data-spt-image-color-black',
}

export const RULE_ATTR_TYPE_LABEL_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.REPLACE_WORDS]: 'Replace with static words',
  [RuleAttrType.CUSTOM]: 'Custom',
  [RuleAttrType.HIDE]: 'Hide Element',
  [RuleAttrType.REMOVE]: 'Remove Element',
  [RuleAttrType.IMAGE_COLOR_WHITE]: 'Change image color to white',
  [RuleAttrType.IMAGE_COLOR_BLACK]: 'Change image color to black',
} as const

export const RULE_ATTR_TYPE_PLACEHOLDER_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.REPLACE_WORDS]: 'Enter number of words',
  [RuleAttrType.CUSTOM]: 'Lorem ipsum',
  [RuleAttrType.HIDE]: '',
  [RuleAttrType.REMOVE]: '',
  [RuleAttrType.IMAGE_COLOR_WHITE]: '',
  [RuleAttrType.IMAGE_COLOR_BLACK]: '',
} as const

export const RULE_ATTR_TYPE_OPTIONS = Object.values(RuleAttrType).map((attr) => ({
  value: attr,
  label: RULE_ATTR_TYPE_LABEL_MAP[attr],
}))

export const RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS = [
  RuleAttrType.HIDE,
  RuleAttrType.REMOVE,
  RuleAttrType.IMAGE_COLOR_WHITE,
  RuleAttrType.IMAGE_COLOR_BLACK,
] as const
