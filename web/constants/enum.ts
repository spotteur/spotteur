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
}

export const RULE_ATTR_TYPE_LABEL_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.REPLACE_WORDS]: 'Replace with static words',
  [RuleAttrType.CUSTOM]: 'Custom',
  [RuleAttrType.HIDE]: 'Hide Element',
  [RuleAttrType.REMOVE]: 'Remove Element',
} as const

export const RULE_ATTR_TYPE_PLACEHOLDER_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.REPLACE_WORDS]: 'Enter number of words',
  [RuleAttrType.CUSTOM]: 'Lorem ipsum',
  [RuleAttrType.HIDE]: '',
  [RuleAttrType.REMOVE]: '',
} as const

export const RULE_ATTR_TYPE_OPTIONS = Object.values(RuleAttrType).map((attr) => ({
  value: attr,
  label: RULE_ATTR_TYPE_LABEL_MAP[attr],
}))

export const RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS = [RuleAttrType.HIDE, RuleAttrType.REMOVE] as const
