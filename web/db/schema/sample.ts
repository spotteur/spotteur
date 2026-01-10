import { sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, varchar } from 'drizzle-orm/pg-core'

export const sample = pgTable('sample', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  name: varchar('name').notNull(),
  description: varchar('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
