import { proxyActivities } from '@temporalio/workflow'

import type * as AccessibilityScanActivities from '@/temporal/activities/accessibility-scan'

const { generateTriggerOptions, triggerAccessibilityScan, writeAccessibilityScanEventShadowData } = proxyActivities<
  typeof AccessibilityScanActivities
>({
  startToCloseTimeout: '10 seconds',
  retry: {
    initialInterval: '1000 ms',
    maximumAttempts: 5,
    backoffCoefficient: 2,
  },
})

interface AccessibilityScanWorkflowParams {
  pageUrl: string
}

export async function accessibilityScanWorkflow({ pageUrl }: AccessibilityScanWorkflowParams): Promise<void> {
  const { requestId, callbackUrl, callbackSecret } = await generateTriggerOptions()
  const scanId = await triggerAccessibilityScan({ pageUrl, requestId, options: { callbackUrl, callbackSecret } })
  await writeAccessibilityScanEventShadowData({ scanId, requestId, callbackSecret })
}
