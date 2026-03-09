'use server'

import { and, asc, desc, eq, notInArray, sql } from 'drizzle-orm'
import { parse as parseYaml } from 'yaml'
import YAML from 'yaml'
import { z } from 'zod'
import { $ZodError } from 'zod/v4/core'

import { DEFAULT_ERROR_MESSAGE } from '@/constants/app'
import { Browser, RuleAttrType } from '@/constants/enum'
import db from '@/db/drizzle'
import { pageRules, projects } from '@/db/schema'
import { PageRuleCreateSchema, PageRulesUpsertSchema, PageRuleBaseSchema } from '@/features/page-rules/schema'
import { defaultValuePageRule } from '@/features/page-rules/template'
import { logger } from '@/lib/logger'

export async function getRule(id: string) {
  const [row] = await db.select().from(pageRules).where(eq(pageRules.id, id)).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, row.projectId)).limit(1)
  return { rule: row, project }
}

export async function listPageRulesByProject({ projectId }: { projectId: string }) {
  try {
    const rows = await db
      .select()
      .from(pageRules)
      .where(eq(pageRules.projectId, projectId))
      .orderBy(asc(pageRules.pagePath))

    return { ok: true, data: rows } as const
  } catch (error) {
    logger.error(error)
    return { ok: false, data: [], error: DEFAULT_ERROR_MESSAGE } as const
  }
}

export async function createPageRule({ projectId, payload }: { projectId: string; payload: unknown }) {
  try {
    const parseResult = PageRuleCreateSchema.safeParse(payload)
    if (!parseResult.success) {
      throw parseResult.error
    }

    await db.transaction(async (tx) => {
      const [project] = await tx.select().from(projects).where(eq(projects.id, projectId)).limit(1)

      await tx
        .insert(pageRules)
        .values(
          parseResult.data.pagePaths.map((pagePath) => ({
            pagePath,
            projectId,
            snapshotBrowsers: project.snapshotBrowsers,
            viewports: project.viewports,
          })),
        )
        .onConflictDoNothing()

      const pageRuleRows = await tx
        .select({ pagePath: pageRules.pagePath })
        .from(pageRules)
        .where(eq(pageRules.projectId, projectId))
        .orderBy(desc(pageRules.createdAt))

      await tx
        .update(projects)
        .set({ pagePaths: pageRuleRows.map((p) => p.pagePath) })
        .where(eq(projects.id, projectId))
    })

    return { ok: true } as const
  } catch (error) {
    if (error instanceof $ZodError) {
      return { ok: false, error: z.prettifyError(error), errors: z.flattenError(error) } as const
    }

    logger.error(error)
    return { ok: false, error: DEFAULT_ERROR_MESSAGE } as const
  }
}

export async function manageRule({ projectId, payload }: { projectId: string; payload: unknown }) {
  const parsed = PageRuleBaseSchema.safeParse(payload)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }

  const [upsert] = await db
    .insert(pageRules)
    .values({
      projectId,
      ...parsed.data,
      snapshotBrowsers: parsed.data.snapshotBrowsers as Browser[],
    })
    .onConflictDoUpdate({
      target: [pageRules.projectId, pageRules.pagePath],
      set: {
        snapshotBrowsers: sql.raw(`excluded.${pageRules.snapshotBrowsers.name}`),
        viewports: sql.raw(`excluded.${pageRules.viewports.name}`),
        mediaReset: sql.raw(`excluded.${pageRules.mediaReset.name}`),
        reducedMotion: sql.raw(`excluded.${pageRules.reducedMotion.name}`),
        rules: sql.raw(`excluded.${pageRules.rules.name}`),
        hookAfterPageLoad: sql.raw(`excluded.${pageRules.hookAfterPageLoad.name}`),
        hookBeforeScreenshot: sql.raw(`excluded.${pageRules.hookBeforeScreenshot.name}`),
      },
    })
    .returning()

  return { ok: true, data: upsert }
}

export async function deletePageRule(id: string) {
  await db.delete(pageRules).where(eq(pageRules.id, id))
  return { ok: true }
}

export async function upsertPageRules(schema: string, projectId: string) {
  try {
    const parsed = parseYaml(schema)
    const payload = await PageRulesUpsertSchema.safeParseAsync(parsed)
    if (!payload.success) {
      return { ok: false, error: z.prettifyError(payload.error), errors: z.flattenError(payload.error) } as const
    }

    const data = await db
      .insert(pageRules)
      .values(
        payload.data.map((rule) => {
          return {
            projectId,
            ...rule,
            snapshotBrowsers: rule.snapshotBrowsers as Browser[],
          }
        }),
      )
      .onConflictDoUpdate({
        target: [pageRules.projectId, pageRules.pagePath],
        set: {
          snapshotBrowsers: sql.raw(`excluded.${pageRules.snapshotBrowsers.name}`),
          viewports: sql.raw(`excluded.${pageRules.viewports.name}`),
          mediaReset: sql.raw(`excluded.${pageRules.mediaReset.name}`),
          reducedMotion: sql.raw(`excluded.${pageRules.reducedMotion.name}`),
          rules: sql.raw(`excluded.${pageRules.rules.name}`),
          hookAfterPageLoad: sql.raw(`excluded.${pageRules.hookAfterPageLoad.name}`),
          hookBeforeScreenshot: sql.raw(`excluded.${pageRules.hookBeforeScreenshot.name}`),
        },
      })
      .returning({ id: pageRules.id })

    // Delete rules that are not provided in the payload
    await db.delete(pageRules).where(
      and(
        eq(pageRules.projectId, projectId),
        notInArray(
          pageRules.id,
          data.map((rule) => rule.id),
        ),
      ),
    )

    return { ok: true }
  } catch (error) {
    logger.error(error)
    return { ok: false, error: DEFAULT_ERROR_MESSAGE } as const
  }
}

export async function pageRuleByPath(projectId: string, path: string) {
  const [row] = await db
    .select()
    .from(pageRules)
    .where(and(eq(pageRules.projectId, projectId), eq(pageRules.pagePath, path)))
    .limit(1)
  return row
}

export async function isPagePathExists(path: string) {
  const [row] = await db.select().from(pageRules).where(eq(pageRules.pagePath, path)).limit(1)
  return !!row
}

export async function existingPageRules(projectId: string) {
  const rules = await db
    .select()
    .from(pageRules)
    .where(eq(pageRules.projectId, projectId))
    .orderBy(asc(pageRules.pagePath))

  const exportedRules = rules.length
    ? // eslint-disable-next-line @typescript-eslint/no-unused-vars
      rules.map(({ id, projectId, createdAt, updatedAt, pagePath, ...rest }) => ({
        pagePath,
        ...rest,
      }))
    : defaultValuePageRule
  const doc = new YAML.Document(exportedRules)
  exportedRules.forEach((_, pageIndex) => {
    ;(doc.getIn([pageIndex, 'snapshotBrowsers'], true) as YAML.Document).commentBefore =
      `Possible values: ${Object.values(Browser).join(', ')}`
    ;(doc.getIn([pageIndex, 'rules'], true) as YAML.Document).commentBefore =
      'An array of rules to dynamically apply `data-spt-*` attributes'

    exportedRules[pageIndex].rules?.forEach((_, ruleIndex) => {
      ;(doc.getIn([pageIndex, 'rules', ruleIndex, 'selectors'], true) as YAML.Document).commentBefore =
        `Array of CSS selectors to target elements`
      ;(doc.getIn([pageIndex, 'rules', ruleIndex, 'attrs'], true) as YAML.Document).commentBefore =
        `Object containing the \`data-spt-*\` attributes to apply to the matched elements. Possible values: ${Object.values(RuleAttrType).join(', ')}`
    })
  })

  return doc.toString()
}

export async function unUsedPagePath(projectId: string) {
  const rule = await db
    .select({ pagePath: pageRules.pagePath })
    .from(pageRules)
    .where(eq(pageRules.projectId, projectId))
  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1)

  const projectPaths = project.pagePaths
  const usedPathSet = new Set(rule.map((p) => p.pagePath))
  const unusedPaths = projectPaths.filter((path) => !usedPathSet.has(path))

  if (unusedPaths.length < 1) return null

  return unusedPaths[0]
}

export type PageRulesListRes = Awaited<ReturnType<typeof listPageRulesByProject>>
export type PageRulesListItemRes = PageRulesListRes['data'][number]
