'use server'

import { desc, eq } from 'drizzle-orm'

import db from '@/db/drizzle'
import { sample } from '@/db/schema/sample'
import { SampleType } from '@/lib/types/sample'

export const selectAll = async () => {
  const selectAll = await db.select().from(sample).orderBy(desc(sample.createdAt))
  return selectAll
}

export const selectById = async (id: string) => {
  const selectById = await db.select().from(sample).where(eq(sample.id, id)).limit(1)

  return selectById.shift()
}

export const create = async (data: SampleType) => {
  const res = await db.insert(sample).values(data).returning()

  return res
}

export const update = async ({ data, id }: { data: typeof sample.$inferInsert; id: string }) => {
  const res = await db.update(sample).set(data).where(eq(sample.id, id)).returning()

  return res.shift()
}

export const deleteData = async (id: string) => {
  const res = await db.delete(sample).where(eq(sample.id, id)).returning()

  return res
}
