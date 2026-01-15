export interface ScreenshotOptions {
  url: string
  width?: number
  height?: number
  browser?: string // 'chrome' | 'firefox' | 'MicrosoftEdge' | 'safari'
  selector?: string
}

export interface ScreenshotWorkflowParams {
  projectId: string | number
  buildId: string | number
  ssOpts: ScreenshotOptions
}

export interface GenerateSnapshotsWorkflowParams {
  projectId: string | number
  buildId: string | number
}

export interface ScreenshotResult {
  buffer: Buffer
  mimetype: string
}
