import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailButton,
  EmailSalutation,
  EmailDivider,
  EmailSubtext,
} from '@/emails/base'

interface BuildPassedEmailProps {
  projectId: string
  buildId: string
  buildIdentifier: string
  totalSnapshotCount: number
}

export default function BuildPassedEmail({
  projectId,
  buildId,
  buildIdentifier,
  totalSnapshotCount,
}: BuildPassedEmailProps) {
  const buildPagePath = `/projects/${projectId}/builds/${buildId}/snapshots` as Route

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

      <EmailButton actionLink={`${APP_URL}${buildPagePath}`} actionLabel="View Build" />

      <EmailSubtext>If you are satisfied with these results, no further action is needed.</EmailSubtext>

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildPassedEmail.PreviewProps = {
  projectId: '019ba184-6205-7172-a327-c0c4b52b08ed',
  buildId: '019ba184-65a6-71c1-82b8-8ad6b4254cb1',
  buildIdentifier: '3edfe26',
  totalSnapshotCount: 10,
} satisfies BuildPassedEmailProps
