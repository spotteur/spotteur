import {
  EmailLayout,
  EmailHeading,
  EmailText,
  EmailSubtext,
  EmailButton,
  EmailDivider,
  EmailSalutation,
} from '@/emails/base'

interface ResetPasswordEmailProps {
  actionLink: string
}

export default function ResetPasswordEmail({ actionLink }: ResetPasswordEmailProps) {
  return (
    <EmailLayout>
      <EmailHeading>Hello!</EmailHeading>

      <EmailText>You are receiving this email because we received a password reset request for your account.</EmailText>

      <EmailButton actionLink={actionLink} actionLabel="Reset Password" />

      <EmailSubtext>
        This password reset link will expire in 1 hour. If you did not request a password reset, no further action is
        required.
      </EmailSubtext>

      <EmailDivider />

      <EmailSalutation />
    </EmailLayout>
  )
}

ResetPasswordEmail.PreviewProps = {
  actionLink: 'https://example.com',
} satisfies ResetPasswordEmailProps
