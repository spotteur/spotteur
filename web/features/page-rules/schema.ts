import { z } from 'zod'

export const PageRuleBrowserEnum = z.array(
  z.enum(['chrome', 'firefox', 'edge'], {
    message: 'Invalid browser option',
  }),
)

export const RuleAttrSchema = z.object({
  value: z.string(),
  name: z.string(),
})

export const RuleSchema = z.object({
  selectors: z.array(z.string()).min(1, 'Value is required'),
  attrs: z.array(RuleAttrSchema),
})

export const PageRuleBaseSchema = z.object({
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
  mediaReset: z.boolean().optional(),
  reducedMotion: z.boolean().optional(),
  pagePaths: z.string().nonempty('Page path is required'),
  rules: z.array(RuleSchema).min(1, 'At least one rule is required'),
})

export const PageRuleCreateSchema = PageRuleBaseSchema

export const PageRuleUpdateSchema = PageRuleBaseSchema.extend({
  id: z.uuid('Invalid id'),
})
