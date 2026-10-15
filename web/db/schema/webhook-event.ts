import { sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, varchar, jsonb, index } from 'drizzle-orm/pg-core'

export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id')
      .primaryKey()
      .default(sql`uuidv7()`),
    publicId: uuid('public_id').unique().notNull(),
    type: varchar('type', { length: 32 }).notNull(),
    secret: varchar('secret', { length: 64 }).notNull(),
    payload: jsonb('payload'),
    // Timestamps
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('type_idx').on(table.type)],
)
