import { workflow } from '@novu/framework'
import { render } from '@react-email/render'

import { NOVU_WORKFLOW_BUILD_CREATED } from '@/constants/novu'
import BuildCreatedEmail from '@/emails/build-created'
import { controlJsonSchema, payloadJsonSchema } from '@/novu/workflows/build-created'

export const buildCreatedNotification = workflow(
  NOVU_WORKFLOW_BUILD_CREATED,
  async ({ step, payload }) => {
    const { read: isInAppNotificationBeenRead } = await step.inApp('in_app_notification', () => {
      return {
        subject: 'A new build created',
        body: `A new build has been created with build identifier ${payload.buildIdentifier}.`,
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
          subject: 'A new build created',
          body: await render(BuildCreatedEmail(payload)),
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
    name: 'Build Created',
  },
)
