import { workflow } from '@novu/framework'
import { render } from '@react-email/render'

import { NOVU_WORKFLOW_BUILD_PASSED } from '@/constants/novu'
import BuildPassedEmail from '@/emails/build-passed'
import { controlJsonSchema, payloadJsonSchema } from '@/novu/workflows/build-passed'

export const buildPassedNotification = workflow(
  NOVU_WORKFLOW_BUILD_PASSED,
  async ({ step, payload }) => {
    const { read: isInAppNotificationBeenRead } = await step.inApp('in_app_notification', () => {
      return {
        subject: `Build ${payload.buildIdentifier} has been marked as passed`,
        body: `There are ${payload.totalSnapshotCount} snapshots that have passed visual regression testing.`,
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
          subject: `Build ${payload.buildIdentifier} has been marked as passed`,
          body: await render(BuildPassedEmail(payload)),
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
    name: 'Build Passed',
  },
)
