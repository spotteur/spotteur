import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailSalutation,
  EmailDivider,
  EmailSubtext,
} from '@/emails/base'
import { payloadJsonSchema, type PayloadSchema } from '@/novu/workflows/build-passed'

export default function BuildPassedEmail({ buildIdentifier, totalSnapshotCount, actionLink }: PayloadSchema) {
  return (
    <EmailLayout>
      <EmailHeading>Hello!</EmailHeading>

      <EmailText>
        We have an update regarding the visual regression testing for build identifier{' '}
        <strong>{buildIdentifier}</strong>.
      </EmailText>

      <EmailText>
        There are <strong>{totalSnapshotCount}</strong> snapshots that have passed visual regression testing. This build
        has been marked as passed.
      </EmailText>

      <EmailButton actionLink={actionLink} actionLabel="View Build" />

      <EmailSubtext>If you are satisfied with these results, no further action is needed.</EmailSubtext>

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildPassedEmail.PreviewProps = {
  buildIdentifier: payloadJsonSchema.properties.buildIdentifier.default,
  totalSnapshotCount: payloadJsonSchema.properties.totalSnapshotCount.default,
  actionLink: payloadJsonSchema.properties.actionLink.default,
} satisfies PayloadSchema
