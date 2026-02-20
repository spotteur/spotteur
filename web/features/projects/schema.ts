import { z } from 'zod'

import {
  BrowsersSchema,
  HookAfterPageLoadSchema,
  HookBeforeScreenshotSchema,
  PagePathsSchema,
  SelectorSchema,
  ViewportsSchema,
} from '@/features/page-rules/schema'

export const ProjectBrowserEnum = z.enum(['chrome', 'firefox', 'edge'], 'Invalid browser option')

export const ProjectBaseSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  baseUrl: z.url('Base URL must be a valid URL').refine((url) => url.endsWith('/'), {
    error: 'Base URL must end with a trailing slash (/)',
  }),
  token: z.string().optional(),
  snapshotBrowsers: BrowsersSchema,
  viewports: ViewportsSchema,
  snapshotSelector: SelectorSchema,
  pagePaths: PagePathsSchema,
  hookAfterPageLoad: HookAfterPageLoadSchema,
  hookBeforeScreenshot: HookBeforeScreenshotSchema,
})

export const ProjectCreateSchema = ProjectBaseSchema

export const ProjectUpdateSchema = ProjectBaseSchema.extend({
  id: z.uuid('Invalid id'),
})
