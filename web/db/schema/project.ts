import { relations, sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, integer, text, varchar, doublePrecision } from 'drizzle-orm/pg-core'

import { BuildStatus, SnapshotApprovalStatus } from '@/constants/status-map'
import { media } from '@/db/schema/media'

export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  name: varchar('name').notNull(),
  baseUrl: varchar('base_url').notNull(),
  token: varchar('token').unique().notNull(),
  snapshotBrowser: varchar('snapshot_browser').notNull(),
  snapshotSelector: varchar('snapshot_selector').notNull(),
  snapshotWidth: integer('snapshot_width').notNull(),
  snapshotHeight: integer('snapshot_height').notNull(),
  pagePaths: text('page_paths')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  baselineBuildId: uuid('baseline_build_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const builds = pgTable('builds', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  baseUrl: varchar('base_url').notNull(),
  baselineBuildId: uuid('baseline_build_id'),
  identifier: varchar('identifier').notNull(),
  pagePaths: text('page_paths')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  status: varchar('status').notNull().$type<BuildStatus>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const snapshots = pgTable('snapshots', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  buildId: uuid('build_id')
    .references(() => builds.id)
    .notNull(),
  pagePath: varchar('page_path').notNull(),
  diffPercentage: doublePrecision('diff_percentage').notNull(),
  approvalStatus: varchar('approval_status').notNull().$type<SnapshotApprovalStatus>(),
  screenshotMediaId: uuid('screenshot_media_id')
    .references(() => media.id)
    .notNull(),
  baselineScreenshotMediaId: uuid('baseline_screenshot_media_id').references(() => media.id),
  diffScreenshotMediaId: uuid('diff_screenshot_media_id').references(() => media.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const projectsRelations = relations(projects, ({ many }) => ({
  builds: many(builds),
}))

export const buildsRelations = relations(builds, ({ one }) => ({
  project: one(projects),
  baselineBuild: one(builds, {
    fields: [builds.baselineBuildId],
    references: [builds.id],
  }),
}))

export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  build: one(builds),
  screenshotMedia: one(media, {
    fields: [snapshots.screenshotMediaId],
    references: [media.id],
  }),
  baselineScreenshotMedia: one(media, {
    fields: [snapshots.baselineScreenshotMediaId],
    references: [media.id],
  }),
  diffScreenshotMedia: one(media, {
    fields: [snapshots.diffScreenshotMediaId],
    references: [media.id],
  }),
}))
