import { z } from 'zod'

import { Browser, RuleAttrType } from '@/constants/enum'

export const RuleAttrSchema = z.object({
  value: z.string(),
  name: z.enum(RuleAttrType, {
    error: 'Invalid attribute type',
  }),
})

export const SelectorSchema = z.string().nonempty('Provide at least 1 selector')

export const RuleSchema = z.object({
  selectors: z.array(SelectorSchema),
  attrs: z.array(RuleAttrSchema),
})

export const RulesSchema = z.array(RuleSchema).optional()
export const PagePathSchema = z
  .string()
  .nonempty('Page path is required')
  .transform((v) => v.trim())
  .refine((v) => v.startsWith('/'), { error: "Page path must start with '/'" })

export const PagePathsSchema = z
  .string()
  .transform((path) =>
    Array.from(
      // Remove duplicate
      new Set(
        path
          // Split by new line
          .split(/\r?\n/)
          // Trim each line
          .map((p) => p.trim())
          // Remove empty line
          .filter(Boolean),
      ),
    ),
  )
  .pipe(z.array(z.string()).nonempty('Provide at least 1 page path'))
  .superRefine((paths, ctx) => {
    const invalidPaths = paths.filter((p) => !p.startsWith('/'))
    if (invalidPaths.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: "Each page path must start with '/'",
      })
    }
  })

export const BrowserSchema = z.string().refine((b) => Object.values(Browser).includes(b as Browser), {
  error: 'Invalid browser option',
})

export const BrowsersSchema = z
  .array(z.string())
  .transform((browsers) => browsers.filter(Boolean))
  .pipe(z.array(BrowserSchema).nonempty('Provide at least 1 browser'))

export const ViewportSchema = z.tuple([
  z.number().positive('Width must be greater than 0'),
  z.number().positive('Height must be greater than 0'),
])

export const ViewportsSchema = z.array(ViewportSchema).nonempty('Provide at least 1 viewport')

export const MediaResetSchema = z.boolean().optional()

export const ReducedMotionSchema = z.boolean().optional()

export const HookAfterPageLoadSchema = z.string().nullable().optional()

export const HookBeforeScreenshotSchema = z.string().nullable().optional()

export const PageRuleBaseSchema = z.object({
  snapshotBrowsers: BrowsersSchema,
  viewports: ViewportsSchema,
  mediaReset: MediaResetSchema,
  reducedMotion: ReducedMotionSchema,
  pagePath: PagePathSchema,
  rules: RulesSchema,
  hookAfterPageLoad: HookAfterPageLoadSchema,
  hookBeforeScreenshot: HookBeforeScreenshotSchema,
})

export const PageRuleCreateSchema = PageRuleBaseSchema
export const PageRulesUpsertSchema = z.array(PageRuleBaseSchema).superRefine((items, ctx) => {
  const map = new Map<string, number[]>()

  items.forEach((item, index) => {
    const key = item.pagePath

    if (!map.has(key)) {
      map.set(key, [index])
    } else {
      map.get(key)!.push(index)
    }
  })

  map.forEach((indexes, path) => {
    if (indexes.length > 1) {
      indexes.forEach((index) => {
        ctx.addIssue({
          code: 'custom',
          message: `Duplicate path "${path}"`,
          path: [index, 'path'],
        })
      })
    }
  })
})

export const PageRuleUpdateSchema = PageRuleBaseSchema.extend({
  id: z.uuid('Invalid id'),
})

export const SpotteurGlobalVariablesSchema = z.object({
  options: z
    .object({
      mediaReset: MediaResetSchema,
      reducedMotion: ReducedMotionSchema,
      rules: z.optional(RulesSchema),
    })
    .optional(),
  hooks: z
    .object({
      'after-page-load': z.string().optional(),
      'before-screenshot': z.string().optional(),
    })
    .optional(),
})
