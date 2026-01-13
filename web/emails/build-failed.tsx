import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailSubtext,
  EmailButton,
  EmailDivider,
  EmailSalutation,
} from '@/emails/base'
import { payloadJsonSchema, type PayloadSchema } from '@/novu/workflows/build-failed'

export default function BuildFailedEmail({
  buildIdentifier,
  rejectedSnapshotCount,
  totalSnapshotCount,
  actionLink,
}: PayloadSchema) {
  return (
    <EmailLayout>
      <EmailHeading>Hello!</EmailHeading>

      <EmailText>
        We have an update regarding the visual regression testing for build identifier{' '}
        <strong>{buildIdentifier}</strong>.
      </EmailText>

      <EmailText>
        There are <strong>{rejectedSnapshotCount}</strong> from <strong>{totalSnapshotCount}</strong> snapshots failed
        visual regression testing. This build has been marked as failed.
      </EmailText>

      <EmailButton actionLink={actionLink} actionLabel="View Build" />

      <EmailSubtext>
        If you are satisfied with these results, no further action is needed. But you can review the failed snapshots
        and re-approve them if necessary.
      </EmailSubtext>

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildFailedEmail.PreviewProps = {
  buildIdentifier: payloadJsonSchema.properties.buildIdentifier.default,
  rejectedSnapshotCount: payloadJsonSchema.properties.rejectedSnapshotCount.default,
  totalSnapshotCount: payloadJsonSchema.properties.totalSnapshotCount.default,
  actionLink: payloadJsonSchema.properties.actionLink.default,
} satisfies PayloadSchema
