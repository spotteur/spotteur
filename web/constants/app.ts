import { type Route } from 'next'

export const THEME_LIGHT = 'light'
export const THEME_DARK = 'dark'

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
