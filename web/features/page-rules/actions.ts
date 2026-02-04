'use server'

import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { parse } from 'yaml'
import { z } from 'zod'

import { type Browser } from '@/constants/enum'
import db from '@/db/drizzle'
import { pageRules, projects } from '@/db/schema'
import { PageRuleCreateSchema, PageRulesUpsertSchema } from '@/features/page-rules/schema'
import YAML from 'yaml'
import { defaultValuePageRule } from '@/features/page-rules/template'

type SortKey = 'createdAt' | 'updatedAt' | ''

const sortColumn = (key: SortKey) => {
  switch (key) {
    case 'updatedAt':
      return pageRules.updatedAt
    case 'createdAt':
    default:
      return pageRules.id
  }
}

export async function getRule(id: string) {
  const [row] = await db.select().from(pageRules).where(eq(pageRules.id, id)).limit(1)
  const [project] = await db.select().from(projects).where(eq(projects.id, row.projectId)).limit(1)
  return { rule: row, project }
}

export async function listPageRulesByProject({
  projectId,
  page = 1,
  pageSize = 10,
  sortBy = 'createdAt',
  sortDir = 'desc',
}: {
  projectId: string
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const rowsQuery = db
    .select()
    .from(pageRules)
    .where(eq(pageRules.projectId, projectId))
    .orderBy(order)
    .limit(pageSize)
    .offset(offset)

  const countQuery = db.select({ total: count() }).from(pageRules).where(eq(pageRules.projectId, projectId))

  const [rows, [{ total }]] = await Promise.all([rowsQuery, countQuery])

  return { data: rows, total }
}

export async function createRule(input: unknown, projectId: string) {
  const parsed = PageRuleCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }
  const isExists = await isPagePathExists(parsed.data.pagePath)
  if (isExists) {
    return {
      ok: false,
      error: {
        formErrors: [],
        fieldErrors: {
          pagePath: ['This page path already exists'] 
        }
      }
    }
  }
  const data = parsed.data

  const [created] = await db
    .insert(pageRules)
    .values({
      projectId,
      snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
      viewports: data.viewports,
      mediaReset: data.mediaReset,
      reducedMotion: data.reducedMotion,
      pagePath: data.pagePath,
      rules: data.rules,
    })
    .returning()

  return { ok: true, data: created }
}

export async function updateRule(input: unknown, id: string, projectId: string) {
  const parsed = PageRuleCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }
  const data = parsed.data

  const [updated] = await db
    .update(pageRules)
    .set({
      snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
      viewports: data.viewports,
      mediaReset: data.mediaReset,
      reducedMotion: data.reducedMotion,
      pagePath: data.pagePath,
      rules: data.rules,
    })
    .where(and(eq(pageRules.id, id), eq(pageRules.projectId, projectId)))
    .returning()

  return { ok: true, data: updated }
}

export async function deletePageRule(id: string) {
  await db.delete(pageRules).where(eq(pageRules.id, id))
  return { ok: true }
}

export async function upsertPageRules(schema: string, projectId: string) {
  const parsed = parse(schema)
  const payload = await PageRulesUpsertSchema.safeParseAsync(parsed)
  if (payload.error) {
    console.log('error =>', payload.error)
    return {ok: false, error: z.flattenError(payload.error)}
  }

  // Upsert the bulk data page rules
  const pageRulesToInsert = parsed.map((rule: typeof pageRules.$inferInsert) => {
    const snapshotBrowsers = rule.snapshotBrowsers as Browser[]
    return ({
      ...rule,
      projectId,
      snapshotBrowsers,
    })
  })

  const [data] = await db.insert(pageRules).values(pageRulesToInsert).onConflictDoUpdate({
    target: pageRules.id,
    set: {
      snapshotBrowsers: sql.raw('excluded.snapshot_browsers'),
      viewports: sql.raw('excluded.viewports'),
      mediaReset: sql.raw('excluded.media_reset'),
      reducedMotion: sql.raw('excluded.reduce_motion'),
      pagePath: sql.raw('excluded.page_path'),
      rules: sql.raw('excluded.rules'),
    },
  }).returning()
  
  return { ok: true, data }
}

export async function isPagePathExists(path: string) {
  const [row] = await db.select().from(pageRules).where(eq(pageRules.pagePath, path)).limit(1)
  return !!row
}

export async function existingPageRules() {
  const rules = await db.select().from(pageRules)

  const exportedRules = rules.length ? rules.map(({ projectId, createdAt, updatedAt, ...rest }) => rest) : defaultValuePageRule
  const doc: any = new YAML.Document(exportedRules);
  exportedRules.forEach((_, pageIndex) => {
    ;(doc.getIn([pageIndex, 'snapshotBrowsers'], true) as any).commentBefore =
      'Possible values: chrome, firefox, edge'
  })

  return doc.toString()
}
