import { workflow } from '@novu/framework'
import { render } from '@react-email/render'

import { NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW } from '@/constants/novu'
import BuildReadyForReviewEmail from '@/emails/build-ready-for-review'
import { controlJsonSchema, payloadJsonSchema } from '@/novu/workflows/build-ready-for-review'

export const buildReadyForReviewNotification = workflow(
  NOVU_WORKFLOW_BUILD_READY_FOR_REVIEW,
  async ({ step, payload }) => {
    const { read: isInAppNotificationBeenRead } = await step.inApp('in_app_notification', () => {
      return {
        subject: `Build ${payload.buildIdentifier} is ready for review`,
        body: `We detect ${payload.hasDiffSnapshotCount} out of ${payload.totalSnapshotCount} snapshots has changed during visual regression testing.`,
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
          subject: `Build ${payload.buildIdentifier} is ready for review`,
          body: await render(BuildReadyForReviewEmail(payload)),
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
    name: 'Build Ready for Review Notification',
  },
)
