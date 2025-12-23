'use server'

import db from '@/db/drizzle'
import { users } from '@/db/schema'

export const selectUsers = async () => {
  const allUsers = db.select().from(users)
  return allUsers
}
