import { z } from 'zod'

export const ProjectBrowserEnum = z.enum(['chrome', 'firefox', 'edge'], 'Invalid browser option')

export const ProjectBaseSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  baseUrl: z.url('Base URL must be a valid URL'),
  token: z.string().optional(),
  snapshotBrowser: ProjectBrowserEnum,
  snapshotSelector: z.string().min(1, 'Selector is required'),
  snapshotWidth: z.number().int().positive('Width must be a positive integer'),
  snapshotHeight: z.number().int().positive('Height must be a positive integer'),
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
