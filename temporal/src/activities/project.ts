import { ApplicationFailure } from '@temporalio/common'
import { ScreenshotOptions } from '../types/screenshot'

export async function getScreenshotOptions(projectId: string | number) {
  // TODO: Fetch project settings from DB
  const project = {
    baseUrl: 'https://example.com',
    pagePaths: ['/'],
    snapshotBrowser: 'chrome',
    snapshotSelector: 'body',
    snapshotWidth: 1280,
    snapshotHeight: 720,
  }

  if (!project.pagePaths.length) {
    throw ApplicationFailure.nonRetryable(`Project ID ${projectId} has no paths set`)
  }

  return project.pagePaths.map(
    (p): ScreenshotOptions => ({
      url: new URL(p, project.baseUrl).toString(),
      width: project.snapshotWidth,
      height: project.snapshotHeight,
      browser: project.snapshotBrowser,
      selector: project.snapshotSelector,
    }),
  )
}
