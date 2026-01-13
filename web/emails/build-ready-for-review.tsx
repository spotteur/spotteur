import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import { SnapshotApprovalStatus } from '@/constants/status-map'
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailSubtext,
  EmailButton,
  EmailDivider,
  EmailSalutation,
} from '@/emails/base'

interface BuildReadyForReviewEmailProps {
  projectId: string
  buildId: string
  buildIdentifier: string
  hasDiffSnapshotCount: number
  totalSnapshotCount: number
}

export default function BuildReadyForReviewEmail({
  projectId,
  buildId,
  buildIdentifier,
  hasDiffSnapshotCount,
  totalSnapshotCount,
}: BuildReadyForReviewEmailProps) {
  const buildPagePath =
    `/projects/${projectId}/builds/${buildId}/snapshots?status=${SnapshotApprovalStatus.pending}` as Route

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

      <EmailButton actionLink={`${APP_URL}${buildPagePath}`} actionLabel="View Build" />

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
  projectId: '019ba184-6205-7172-a327-c0c4b52b08ed',
  buildId: '019ba184-65a6-71c1-82b8-8ad6b4254cb1',
  buildIdentifier: '3edfe26',
  hasDiffSnapshotCount: 3,
  totalSnapshotCount: 10,
} satisfies BuildReadyForReviewEmailProps
