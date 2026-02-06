'use server'

import { and, asc, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import { type Browser } from '@/constants/enum'
import db from '@/db/drizzle'
import { pageRules, projects } from '@/db/schema'
import { PageRuleCreateSchema } from '@/features/page-rules/schema'

import { type PageRuleFormInput } from './form'

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

export async function manageRule(input: PageRuleFormInput, projectId: string) {
  const parsed = PageRuleCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }

  const { createdAt, updatedAt, ...data } = input

  const [upsert] = await db
    .insert(pageRules)
    .values({
      projectId,
      ...data,
      snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
    }).onConflictDoUpdate({
      target: pageRules.id,
      set: {
        snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
        viewports: data.viewports,
        mediaReset: data.mediaReset,
        reducedMotion: data.reducedMotion,
        pagePath: data.pagePath,
        rules: data.rules,
      },
    })
    .returning()

  return { ok: true, data: upsert }
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
