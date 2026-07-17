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

export const DiffTolerancePercentageSchema = z
  .number()
  .min(0, 'Diff tolerance must be greater than or equal to 0')
  .max(100, 'Diff tolerance must be less than or equal to 100')
  // Limits input to 13 decimal places, ref: https://stackoverflow.com/a/75291616
  .refine((x) => x * 10_000_000_000_000 - Math.trunc(x * 10_000_000_000_000) < Number.EPSILON, {
    error: 'Diff tolerance can have up to 13 decimal places',
  })

export const ProjectBaseSchema = z.object({
  name: ProjectNameSchema,
  baseUrl: BaseUrlSchema,
  snapshotBrowsers: BrowsersSchema,
  viewports: ViewportsSchema,
  hookAfterPageLoad: HookAfterPageLoadSchema,
  hookBeforeScreenshot: HookBeforeScreenshotSchema,
  diffTolerancePercentage: DiffTolerancePercentageSchema,
  cookieSetting: CookieSettingSchema,
})

export const ProjectCreateSchema = z.object({
  ...ProjectBaseSchema.shape,
  pagePaths: PagePathsSchema.default([]),
})

export const ProjectUpdateSchema = z.object({
  ...ProjectBaseSchema.shape,
  token: z.string().optional(),
})
