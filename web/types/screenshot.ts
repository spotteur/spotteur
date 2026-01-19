import { type Browser } from '@/constants/enum'
import { type snapshots } from '@/db/schema'

export type SnapshotPayload = Pick<
  typeof snapshots.$inferSelect,
  'id' | 'buildId' | 'pagePath' | 'browser' | 'viewportWidth' | 'viewportHeight'
> & {
  pageUrl: string
  selector: string
  s3Path?: string
}

export interface ScreenshotOptions {
  url: string
  width: number
  height: number
  browser: Browser
  selector: string
}

export interface ScreenshotWorkflowParams {
  projectId: string
  payload: SnapshotPayload
}

export interface GenerateSnapshotsWorkflowParams {
  projectId: string
  buildId: string
}

export interface ScreenshotResult {
  buffer: Buffer
  mimetype: string
}

export interface ProcessScreenshotParams {
  projectId: string
  payload: SnapshotPayload
  tempPath: string
}
