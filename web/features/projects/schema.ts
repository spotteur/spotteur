import { z } from 'zod'

export const ProjectBrowserEnum = z.enum(['chrome', 'firefox', 'edge'], 'Invalid browser option')

export const ProjectBaseSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  baseUrl: z.url('Base URL must be a valid URL').refine((url) => url.endsWith('/'), {
    message: 'Base URL must end with a trailing slash (/)',
  }),
  token: z.string().optional(),
  snapshotBrowsers: z
    .array(z.string())
    .transform((paths) => paths.filter(Boolean))
    .pipe(z.array(z.string()).min(1, 'Provide at least 1 browser')),
  viewports: z
    .array(
      z.tuple([
        z.number().positive('Width must be greater than 0'),
        z.number().positive('Height must be greater than 0'),
      ]),
    )
    .nonempty('Viewport is required'),
  snapshotSelector: z.string().min(1, 'Selector is required'),
  pagePaths: z
    .array(z.string())
    .transform((paths) => paths.filter(Boolean))
    .pipe(
      z
        .array(z.string().refine((v) => v.startsWith('/'), { message: "Each path must start with '/'" }))
        .min(1, 'Provide at least 1 path'),
    ),
})

export const ProjectCreateSchema = ProjectBaseSchema

export const ProjectUpdateSchema = ProjectBaseSchema.extend({
  id: z.uuid('Invalid id'),
})
