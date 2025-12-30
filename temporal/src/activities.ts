import { ApplicationFailure } from '@temporalio/common';

export async function helloWorld() {
  return 'Hello World!';
}

export async function takeScreenshot(url: string) {
  try {
    return `Taking screenshot for URL ${url}`;
  } catch (err) {
    console.error(err);
    throw ApplicationFailure.retryable('Uncaught error!');
  }
}

export async function saveScreenshot(projectId: string | number, buildId: string | number, buffer: Buffer) {
  try {
    return 'Saving screenshot';
  } catch (err) {
    console.error(err);
    throw ApplicationFailure.retryable('Uncaught error!');
  }
}
