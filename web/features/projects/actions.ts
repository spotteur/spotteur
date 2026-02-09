'use server'

import { and, asc, count, desc, eq, ilike, inArray, type SQL } from 'drizzle-orm'
import { z } from 'zod'

import { type Browser } from '@/constants/enum'
import db from '@/db/drizzle'
import { builds, pageRules, projects, snapshots } from '@/db/schema'
import { ProjectCreateSchema, ProjectUpdateSchema } from '@/features/projects/schema'

type SortKey = 'name' | 'createdAt' | 'updatedAt' | ''

const sortColumn = (key: SortKey) => {
  switch (key) {
    case 'name':
      return projects.name
    case 'updatedAt':
      return projects.updatedAt
    case 'createdAt':
    default:
      return projects.id
  }
}

export async function listProjects({
  page = 1,
  pageSize = 10,
  sortBy = '',
  sortDir = 'desc',
  search = '',
}: {
  page?: number
  pageSize?: number
  sortBy?: SortKey
  sortDir?: 'asc' | 'desc'
  search?: string
}) {
  const offset = (page - 1) * pageSize
  const column = sortColumn(sortBy)
  const order = sortDir === 'asc' ? asc(column) : desc(column)

  const filters = [] as SQL[]
  const trimmedSearch = search?.trim()
  if (trimmedSearch) {
    filters.push(ilike(projects.name, `%${trimmedSearch}%`))
  }

  const where = filters.length > 0 ? and(...filters) : undefined

  const baseRowsQuery = db.select().from(projects).orderBy(order).limit(pageSize).offset(offset)
  const baseCountQuery = db.select({ total: count() }).from(projects)

  const rowsQuery = where ? baseRowsQuery.where(where) : baseRowsQuery
  const countQuery = where ? baseCountQuery.where(where) : baseCountQuery

  const [rows, [{ total }]] = await Promise.all([rowsQuery, countQuery])

  return { data: rows, total }
}

export async function getProject(id: string) {
  const [row] = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
  return row ?? null
}

export async function createProject(input: unknown) {
  const parsed = ProjectCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }

  const data = parsed.data
  const token = data.token && data.token.length > 0 ? data.token : crypto.randomUUID()

  const [created] = await db
    .insert(projects)
    .values({
      name: data.name,
      baseUrl: data.baseUrl,
      token,
      snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
      snapshotSelector: data.snapshotSelector,
      viewports: data.viewports,
      pagePaths: data.pagePaths,
    })
    .returning()
  return { ok: true, data: created }
}

export async function updateProject(input: unknown) {
  const parsed = ProjectUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: z.flattenError(parsed.error) }
  }

  const data = parsed.data
  const token = data.token && data.token.length > 0 ? data.token : crypto.randomUUID()

  const [updated] = await db
    .update(projects)
    .set({
      name: data.name,
      baseUrl: data.baseUrl,
      token,
      snapshotBrowsers: data.snapshotBrowsers.map((b) => b as Browser),
      snapshotSelector: data.snapshotSelector,
      viewports: data.viewports,
      pagePaths: data.pagePaths,
    })
    .where(eq(projects.id, data.id))
    .returning()
  return { ok: true, data: updated }
}

export async function deleteProject(id: string) {
  const buildIds = (await db.select({ id: builds.id }).from(builds).where(eq(builds.projectId, id))).map((b) => b.id)
  await db.delete(snapshots).where(inArray(snapshots.buildId, buildIds))
  await db.delete(builds).where(inArray(builds.id, buildIds))
  await db.delete(pageRules).where(eq(pageRules.projectId, id))
  await db.delete(projects).where(eq(projects.id, id))
  return { ok: true } as const
}
