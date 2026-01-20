import type z from 'zod'

import { type snapshots } from '@/db/schema'
import { type SpotteurGlobalVariablesSchema } from '@/features/page-rules/schema'

export type SnapshotPayload = Pick<
  typeof snapshots.$inferSelect,
  'id' | 'buildId' | 'pagePath' | 'browser' | 'viewportWidth' | 'viewportHeight'
> & {
  projectId: string
  pageUrl: string
  selector: string
  s3Prefix: string
  fileName: string
  reducedMotion: boolean
  mediaReset: boolean
  rules?: NonNullable<z.infer<typeof SpotteurGlobalVariablesSchema>['options']>['rules']
  hooks?: z.infer<typeof SpotteurGlobalVariablesSchema>['hooks']
}

export interface ScreenshotWorkflowParams {
  payload: SnapshotPayload
}

export interface ScreenshotWorkflowResult {
  snapshot: typeof snapshots.$inferSelect
}

export interface GenerateSnapshotsWorkflowParams {
  projectId: string
  buildId: string
}

export interface CaptureScreenshotParams {
  payload: SnapshotPayload
  logPrefix: string
}

export interface CaptureScreenshotResult {
  tempPath: string
}

export interface ProcessScreenshotParams {
  payload: SnapshotPayload
  logPrefix: string
  tempPath: string
}

export interface ProcessScreenshotResult {
  snapshot: typeof snapshots.$inferSelect
}
