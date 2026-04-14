import { z } from 'zod'

import {
  BrowsersSchema,
  HookAfterPageLoadSchema,
  HookBeforeScreenshotSchema,
  PagePathsSchema,
  ViewportsSchema,
} from '@/features/page-rules/schema'

export const ProjectNameSchema = z.string().min(2, 'Project name must be at least 2 characters')

export const ProjectBrowserEnum = z.enum(['chrome', 'firefox', 'edge'], 'Invalid browser option')

export const BaseUrlSchema = z.url('Base URL must be a valid URL').refine((url) => url.endsWith('/'), {
  error: 'Base URL must end with a trailing slash (/)',
})

export const CookieSettingSchema = z
  .object({
    name: z.string().optional(),
    value: z.string().optional(),
    domain: z.string().optional(),
    secure: z.boolean().optional(),
  })
  .optional()

export const ProjectBaseSchema = z.object({
  name: ProjectNameSchema,
  baseUrl: BaseUrlSchema,
  snapshotBrowsers: BrowsersSchema,
  viewports: ViewportsSchema,
  hookAfterPageLoad: HookAfterPageLoadSchema,
  hookBeforeScreenshot: HookBeforeScreenshotSchema,
  cookieSetting: CookieSettingSchema,
})

export const ProjectCreateSchema = z.object({
  ...ProjectBaseSchema.shape,
  pagePaths: PagePathsSchema,
})

export const ProjectUpdateSchema = z.object({
  ...ProjectBaseSchema.shape,
  token: z.string().optional(),
})
