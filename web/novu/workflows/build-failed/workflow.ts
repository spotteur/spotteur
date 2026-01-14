import { workflow } from '@novu/framework'
import { render } from '@react-email/render'

import { NOVU_WORKFLOW_BUILD_FAILED } from '@/constants/novu'
import BuildFailedEmail from '@/emails/build-failed'
import { controlJsonSchema, payloadJsonSchema } from '@/novu/workflows/build-failed'

export const buildFailedNotification = workflow(
  NOVU_WORKFLOW_BUILD_FAILED,
  async ({ step, payload }) => {
    const { read: isInAppNotificationBeenRead } = await step.inApp('in_app_notification', () => {
      return {
        subject: `Build ${payload.buildIdentifier} has been marked as failed`,
        body: `There are ${payload.rejectedSnapshotCount} from ${payload.totalSnapshotCount} snapshots failed visual regression testing.`,
        redirect: {
          url: payload.actionLink,
        },
      }
    })

    await step.delay('delay', () => {
      return {
        amount: 5,
        unit: 'minutes',
      }
    })

    await step.email(
      'email_notification',
      async () => {
        return {
          subject: `Build ${payload.buildIdentifier} has been marked as failed`,
          body: await render(BuildFailedEmail(payload)),
        }
      },
      {
        skip: () => isInAppNotificationBeenRead,
      },
    )
  },
  {
    payloadSchema: payloadJsonSchema,
    controlSchema: controlJsonSchema,
    name: 'Build Failed',
  },
)
