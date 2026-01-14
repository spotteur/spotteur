import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailSubtext,
  EmailButton,
  EmailDivider,
  EmailSalutation,
} from '@/emails/base'
import { payloadJsonSchema, type PayloadSchema } from '@/novu/workflows/build-ready-for-review'

export default function BuildReadyForReviewEmail({
  buildIdentifier,
  hasDiffSnapshotCount,
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
        We detect <strong>{hasDiffSnapshotCount}</strong> out of <strong>{totalSnapshotCount}</strong> snapshots has
        changed during visual regression testing. Please review the snapshots before approving or rejecting them.
      </EmailText>

      <EmailButton actionLink={actionLink} actionLabel="View Build" />

      <EmailSubtext>
        You can put your review on all snapshots. If all snapshot approved, this build will be marked as Passed and will
        mark this build as a baseline build. Rejecting any snapshot will mark this build as Failed and maintain your
        current baseline build.
      </EmailSubtext>

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildReadyForReviewEmail.PreviewProps = {
  buildIdentifier: payloadJsonSchema.properties.buildIdentifier.default,
  hasDiffSnapshotCount: payloadJsonSchema.properties.hasDiffSnapshotCount.default,
  totalSnapshotCount: payloadJsonSchema.properties.totalSnapshotCount.default,
  actionLink: payloadJsonSchema.properties.actionLink.default,
} satisfies PayloadSchema
