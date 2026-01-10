import { sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, integer, varchar } from 'drizzle-orm/pg-core'

export const media = pgTable('media', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  fileName: varchar('file_name').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: varchar('mime_type').notNull(),
  width: integer('width'),
  height: integer('height'),
  path: varchar('path').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})
