import { type Route } from 'next'

import { type NavigationType } from '@/lib/type/app'

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
export const DEFAULT_ERROR_MESSAGE = 'Internal Server Error'
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong. Please try again later.'
export const VALIDATION_ERROR_DESCRIPTION = 'Please review the error and try again.'

export const projectsMenu = (projectId: string) => {
  return [
    {
      label: 'General',
      url: `/projects/${projectId}` as Route,
    },
    {
      label: 'Page Rules',
      url: `/projects/${projectId}/page-rules` as Route,
    },
    {
      label: 'Builds',
      url: `/projects/${projectId}/builds` as Route,
    },
  ]
}

export const snapshotsMenu = (projectId: string, buildId: string) => {
  return [
    {
      label: 'Snapshots',
      url: `/projects/${projectId}/builds/${buildId}/snapshots` as Route,
    },
    {
      label: 'Logs',
      url: `/projects/${projectId}/builds/${buildId}/logs` as Route,
    },
  ]
}

export const defaultMenu: NavigationType[] = [
  {
    label: 'Projects',
    url: '/projects',
  },
]
