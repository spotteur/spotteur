import { z } from 'zod'

import {
  Browser,
  RULE_ATTR_TYPE_LABEL_MAP,
  RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS,
  RuleAttrType,
} from '@/constants/enum'

export const RuleAttrSchema = z
  .object({
    name: z.enum(RuleAttrType),
    value: z.string(),
  })
  .refine(
    (data) => {
      if (RULE_ATTR_TYPE_WITH_TRUE_VALUE_OPTIONS.find((attr) => attr === data.name)) {
        return data.value === 'true'
      }
      return true
    },
    {
      error: 'Value must be "true" for this attribute',
      path: ['value'],
    },
  )
  .refine(
    (data) => {
      if (data.name === RuleAttrType.REPLACE_WORDS) {
        const num = Number(String(data.value))
        return !Number.isNaN(num) && num > 0
      }
      return true
    },
    {
      error: 'Value must be a number greater than 0 for this attribute',
      path: ['value'],
    },
  )

export const SelectorSchema = z.string().min(1, 'Invalid CSS selector')

export const RuleSchema = z.object({
  identifier: z.string({ error: 'Identifier must be a string' }).optional(),
  selectors: z.array(SelectorSchema).min(1, 'Provide at least 1 selector'),
  attrs: z
    .array(RuleAttrSchema)
    .min(1, 'Provide at least 1 rule')
    .transform((val, ctx) => {
      const names = new Set<string>()
      for (const attr of val) {
        if (names.has(attr.name)) {
          ctx.addIssue({
            code: 'custom',
            message: `Duplicate rule "${RULE_ATTR_TYPE_LABEL_MAP[attr.name]}" in the same rule group`,
          })
          return z.NEVER
        }

        names.add(attr.name)
      }
      return val
    }),
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
  z.number().positive({ error: 'Width must be greater than 0', abort: true }),
  z.number().positive({ error: 'Height must be greater than 0', abort: true }),
])

export const ViewportsSchema = z
  .array(ViewportSchema)
  .nonempty('Provide at least 1 viewport')
  .superRefine((viewports, ctx) => {
    const viewportSet = new Set<string>()
    const viewportWidthSet = new Set<number>()
    const duplicateViewports = []
    const duplicateViewportWidths = []
    for (const [width, height] of viewports) {
      const key = `${width}x${height}`
      if (viewportSet.has(key)) {
        duplicateViewports.push(key)
      } else {
        viewportSet.add(key)
      }

      if (viewportWidthSet.has(width)) {
        duplicateViewportWidths.push(width)
      } else {
        viewportWidthSet.add(width)
      }
    }

    if (duplicateViewports.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: `Viewport dimensions must be unique. Duplicate viewports found: ${duplicateViewports.join(', ')}`,
      })

      // Stop further validation
      return z.NEVER
    }

    if (duplicateViewportWidths.length > 0) {
      ctx.addIssue({
        code: 'custom',
        message: `Viewport widths must be unique. Duplicate widths found: ${duplicateViewportWidths.join(', ')}`,
      })
    }
  })

export const MediaResetSchema = z.boolean().optional()

export const ReducedMotionSchema = z.boolean().optional()

export const HookAfterPageLoadSchema = z.string().nullable().optional()

export const HookBeforeScreenshotSchema = z.string().nullable().optional()

export const ProxySchema = z
  .string()
  .nullable()
  .optional()
  .transform((value) => value?.trim() || null)
  .superRefine((value, ctx) => {
    if (!value) {
      return z.NEVER
    }

    try {
      const proxyUrl = new URL(value.match(/^[a-zA-Z][a-zA-Z\d+.-]*:\/\//) ? value : `http://${value}`)
      if (proxyUrl.username) {
        ctx.addIssue({
          code: 'custom',
          message: 'Only unauthenticated proxies are supported',
        })
        return z.NEVER
      }

      if (proxyUrl.protocol !== 'http:') {
        ctx.addIssue({
          code: 'custom',
          message: 'Only HTTP proxies are supported',
        })
        return z.NEVER
      }
    } catch {
      ctx.addIssue({
        code: 'custom',
        message: 'Invalid proxy format. Expected format is host:port or protocol://host:port',
      })
      return z.NEVER
    }
  })

export const PageRuleBaseSchema = z.object({
  snapshotBrowsers: BrowsersSchema,
  viewports: ViewportsSchema,
  mediaReset: MediaResetSchema,
  reducedMotion: ReducedMotionSchema,
  pagePath: PagePathSchema,
  rules: RulesSchema,
  hookAfterPageLoad: HookAfterPageLoadSchema,
  hookBeforeScreenshot: HookBeforeScreenshotSchema,
  proxy: ProxySchema,
})

export type PageRuleFormInput = z.input<typeof PageRuleBaseSchema>

export const PageRuleCreateSchema = z.object({
  pagePaths: PagePathsSchema.transform((pagePaths) => Array.from(new Set(pagePaths))),
})

export type PageRuleCreateFormInput = z.input<typeof PageRuleCreateSchema>

export const PageRulesUpsertSchema = z
  .array(PageRuleBaseSchema, 'Invalid page rule format')
  .superRefine((items, ctx) => {
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

export const SpotteurGlobalVariablesSchema = z.object({
  options: z
    .object({
      mediaReset: MediaResetSchema,
      reducedMotion: ReducedMotionSchema,
      rules: RulesSchema,
    })
    .optional(),
  hooks: z
    .object({
      'after-page-load': HookAfterPageLoadSchema,
      'before-screenshot': HookBeforeScreenshotSchema,
    })
    .optional(),
})
