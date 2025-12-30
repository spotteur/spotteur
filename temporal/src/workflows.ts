import { proxyActivities } from "@temporalio/workflow";
import type * as activities from "./activities.ts";

const { takeScreenshot, saveScreenshot, helloWorld } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "3 seconds",
  retry: {
    initialInterval: "500 ms",
    maximumAttempts: 3,
    backoffCoefficient: 1.5,
  },
});

export async function helloWorldWorkflow(): Promise<string> {
  return helloWorld();
}

export type ScreenshotWorkflowParams = {
  projectId: string | number;
  buildId: string | number;
  url: string;
};

/**
 * Workflow for generating screenshots and saving them to DB and S3.
 * @param args Workflow args
 */
export async function screenshotWorkflow({
  projectId,
  buildId,
  url,
}: ScreenshotWorkflowParams) {
  const ss = await takeScreenshot(url);
  const ssPath = await saveScreenshot(projectId, buildId, Buffer.from(ss));
  return ssPath;
}
