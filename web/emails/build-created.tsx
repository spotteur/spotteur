import { EmailLayout, EmailHeading, EmailText, EmailButton, EmailSalutation, EmailDivider } from '@/emails/base'
import { payloadJsonSchema, type PayloadSchema } from '@/novu/workflows/build-created'

export default function BuildCreatedEmail({ projectName, buildIdentifier, actionLink }: PayloadSchema) {
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

      <EmailButton actionLink={actionLink} actionLabel="View Build" />

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

BuildCreatedEmail.PreviewProps = {
  projectName: payloadJsonSchema.properties.projectName.default,
  buildIdentifier: payloadJsonSchema.properties.buildIdentifier.default,
  actionLink: payloadJsonSchema.properties.actionLink.default,
} satisfies PayloadSchema
