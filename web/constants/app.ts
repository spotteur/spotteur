import { type Route } from 'next'

import { Browser } from '@/constants/enum'
import { type NavigationType } from '@/types/app'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

export const S3_PRESIGN_TIMEOUT = 900

export const STORAGE_FOLDER = '/storage'

export const DEFAULT_ERROR_MESSAGE = 'Internal Server Error'
export const DEFAULT_ERROR_DESCRIPTION = 'Something went wrong. Please try again later.'
export const VALIDATION_ERROR_DESCRIPTION = 'Please review the error and try again.'

export const projectsMenu = (projectId: string): NavigationType[] => {
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

export const snapshotsMenu = (projectId: string, buildId: string): NavigationType[] => {
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

export const DEFAULT_SNAPSHOTS_WIDTH = 1920
export const DEFAULT_SNAPSHOTS_HEIGHT = 1080
export const DEFAULT_SNAPSHOTS_BROWSER = Browser.CHROME
export const DEFAULT_SNAPSHOTS_SELECTOR = 'body'
