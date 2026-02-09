import { relations, sql } from 'drizzle-orm'
import { pgTable, uuid, timestamp, text, varchar, doublePrecision, jsonb, boolean } from 'drizzle-orm/pg-core'
import { type z } from 'zod'

import { type Browser } from '@/constants/enum'
import { type BuildStatus, type SnapshotApprovalStatus } from '@/constants/status-map'
import { media } from '@/db/schema/media'
import { type ViewportsSchema, type RulesSchema } from '@/features/page-rules/schema'

export const projects = pgTable('projects', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  name: varchar('name').notNull(),
  baseUrl: varchar('base_url').notNull(),
  token: varchar('token').unique().notNull(),
  snapshotBrowsers: text('snapshot_browsers')
    .array()
    .notNull()
    .$type<Browser[]>()
    .default(sql`'{}'::text[]`),
  viewports: jsonb('viewports')
    .$type<[number, number][]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  snapshotSelector: varchar('snapshot_selector').notNull(),
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
  viewportWidth: doublePrecision('viewport_width').notNull(),
  viewportHeight: doublePrecision('viewport_height').notNull(),
  browser: varchar('browser').notNull().$type<Browser>(),
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

export const pageRules = pgTable('page_rules', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  projectId: uuid('project_id')
    .references(() => projects.id)
    .notNull(),
  snapshotBrowsers: text('snapshot_browsers')
    .array()
    .notNull()
    .$type<Browser[]>()
    .default(sql`'{}'::text[]`),
  viewports: jsonb('viewports')
    .notNull()
    .$type<z.infer<typeof ViewportsSchema>>()
    .default(sql`'[]'::jsonb`),
  pagePath: varchar('page_path').notNull(),
  mediaReset: boolean('media_reset').notNull().default(true),
  reducedMotion: boolean('reduce_motion').notNull().default(true),
  rules: jsonb('rules')
    .notNull()
    .$type<z.infer<typeof RulesSchema>>()
    .default(sql`'[]'::jsonb`),
  hookAfterPageLoad: text('hook_after_page_load'),
  hookBeforeScreenshot: text('hook_before_screenshot'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const projectsRelations = relations(projects, ({ many }) => ({
  builds: many(builds),
  pageRules: many(pageRules),
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

export const pageRuleRelations = relations(projects, ({ one }) => ({
  project: one(projects),
}))
