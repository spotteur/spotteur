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

export enum RuleAttrType {
  hide = 'data-spt-hide',
  remove = 'data-spt-remove',
  replaceWords = 'data-spt-replace-words',
  custom = 'data-spt-custom',
}

export const RULE_ATTR_TYPE_LABEL_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.replaceWords]: 'Replace with static words',
  [RuleAttrType.custom]: 'Custom',
  [RuleAttrType.hide]: 'Hide Element',
  [RuleAttrType.remove]: 'Remove Element',
} as const

export const RULE_ATTR_TYPE_PLACEHOLDER_MAP: Record<RuleAttrType, string> = {
  [RuleAttrType.replaceWords]: 'Enter number of words',
  [RuleAttrType.custom]: 'Lorem ipsum',
  [RuleAttrType.hide]: '',
  [RuleAttrType.remove]: '',
} as const

export const RuleAttrTypeOptions = Object.values(RuleAttrType).map((attr) => ({
  value: attr,
  label: RULE_ATTR_TYPE_LABEL_MAP[attr],
}))

export const RuleAttrTypeWithTrueValueOptions = [RuleAttrType.hide, RuleAttrType.remove] as const
