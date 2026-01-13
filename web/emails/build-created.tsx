import { type Route } from 'next'

import { APP_URL } from '@/constants/env'
import { EmailLayout, EmailHeading, EmailText, EmailButton, EmailSalutation, EmailDivider } from '@/emails/base'

interface BuildCreatedEmailProps {
  projectId: string
  projectName: string
  buildId: string
  buildIdentifier: string
}

export default function BuildCreatedEmail({
  projectId,
  projectName,
  buildId,
  buildIdentifier,
}: BuildCreatedEmailProps) {
  const buildPagePath = `/projects/${projectId}/builds/${buildId}/snapshots` as Route

  return (
    <EmailLayout>
      <EmailHeading>Hello!</EmailHeading>

      <EmailText>
        A new build has been created for project <strong>{projectName}</strong> with build identifier{' '}
        <strong>{buildIdentifier}</strong>.
      </EmailText>

      <EmailText>
        The visual regression testing for this build will be started. Click the button below to view the details.
      </EmailText>

      <EmailButton actionLink={`${APP_URL}${buildPagePath}`} actionLabel="View Build" />

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildCreatedEmail.PreviewProps = {
  projectId: '019ba184-6205-7172-a327-c0c4b52b08ed',
  projectName: 'Demo Project',
  buildId: '019ba184-65a6-71c1-82b8-8ad6b4254cb1',
  buildIdentifier: '3edfe26',
} satisfies BuildCreatedEmailProps
