import { type Route } from 'next'

import { Browser } from '@/constants/enum'
import { TEMPORAL_DEFAULT_STORAGE_DIR } from '@/constants/env'
import { type NavigationType } from '@/types/app'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

export const S3_PRESIGN_TIMEOUT = 900

export const STORAGE_FOLDER = TEMPORAL_DEFAULT_STORAGE_DIR || '/storage'

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
      label: 'Pages',
      url: `/projects/${projectId}/pages` as Route,
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
      url: `/builds/${buildId}/snapshots` as Route,
    },
    {
      label: 'Review Changes',
      url: `/builds/${buildId}/snapshots/review` as Route,
    },
    {
      label: 'Logs',
      url: `/builds/${buildId}/logs` as Route,
    },
  ]
}

export const defaultMenu = (): NavigationType[] => {
  return [
    {
      label: 'Projects',
      url: '/projects',
    },
  ]
}

export const DEFAULT_SNAPSHOTS_WIDTH = 1920
export const DEFAULT_SNAPSHOTS_HEIGHT = 1080
export const DEFAULT_SNAPSHOTS_BROWSER = Browser.CHROME
export const DEFAULT_SNAPSHOTS_SELECTOR = 'body'

export const PAGE_SIZE_OPTIONS = [6, 12, 24, 48]
