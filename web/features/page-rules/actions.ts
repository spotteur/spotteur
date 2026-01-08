'use server'

import { asc, count, desc, eq } from 'drizzle-orm'
import { z } from 'zod'

import db from '@/db/drizzle'
import { pageRules, projects } from '@/db/schema'
import { PageRuleCreateSchema } from '@/features/page-rules/schema'

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

export async function createRule(input: unknown, project_id: string) {
  const parsed = PageRuleCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }
  const data = parsed.data

  const insert = {
    projectId: project_id,
    snapshotBrowsers: data.snapshotBrowsers,
    viewports: data.viewports,
    mediaReset: data.mediaReset,
    reducedMotion: data.reducedMotion,
    pagePath: data.pagePaths,
    rules: data.rules,
  }

  const payload = {
    ...insert,
    viewports: insert.viewports.map((v) => [v[0], v[1]] as [number, number]),
  }
  const [created] = await db.insert(pageRules).values(payload).returning()

  return { ok: true, data: created }
}

export async function updateRule(input: unknown, id: string, projectId: string) {
  const parsed = PageRuleCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }
  const data = parsed.data

  const update = {
    projectId: projectId,
    snapshotBrowsers: data.snapshotBrowsers,
    viewports: data.viewports,
    mediaReset: data.mediaReset,
    reducedMotion: data.reducedMotion,
    pagePath: data.pagePaths,
    rules: data.rules,
  }
  const payload = {
    ...update,
    viewports: update.viewports.map((v) => [v[0], v[1]] as [number, number]),
  }

  const [updated] = await db.update(pageRules).set(payload).where(eq(pageRules.id, id)).returning()

  return { ok: true, data: updated }
}

export async function deletePageRule(id: string) {
  await db.delete(pageRules).where(eq(pageRules.id, id))
  return { ok: true }
}
