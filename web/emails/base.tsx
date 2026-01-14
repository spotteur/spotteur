import { Body, Container, Head, Html, Section, Tailwind, Text, Button, Hr } from '@react-email/components'
import React from 'react'

import { cn } from '@/lib/utils'

interface EmailLayoutProps {
  children: React.ReactNode
}

export function EmailLayout({ children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Tailwind>
        <Body className="bg-gray-100 font-sans">
          <Container className="mx-auto max-w-150 pb-3">
            <Section className="py-6 text-center">
              <Text className="m-0 text-2xl font-bold text-gray-900">Spotteur</Text>
            </Section>

            <Section className="overflow-hidden rounded-lg bg-white shadow-sm">
              <Section className="p-8">{children}</Section>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  )
}

interface EmailHeadingProps {
  children: React.ReactNode
}

export function EmailHeading({ children }: EmailHeadingProps) {
  return <Text className="m-0 mb-4 text-xl font-bold text-gray-900">{children}</Text>
}

interface EmailTextProps {
  children: React.ReactNode
  className?: string
}

export function EmailText({ children, className = '' }: EmailTextProps) {
  return <Text className={cn('m-0 mb-4 leading-relaxed text-gray-600', className)}>{children}</Text>
}

interface EmailSubtextProps {
  children: React.ReactNode
}

export function EmailSubtext({ children }: EmailSubtextProps) {
  return <Text className="m-0 text-sm leading-relaxed text-gray-600">{children}</Text>
}

interface EmailButtonProps {
  actionLink: string
  actionLabel: string
}

export function EmailButton({ actionLink, actionLabel }: EmailButtonProps) {
  return (
    <Section className="my-6 text-center">
      <Button
        href={actionLink}
        className="inline-block rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white no-underline"
      >
        {actionLabel}
      </Button>
    </Section>
  )
}

export function EmailDivider() {
  return <Hr className="my-6 border-gray-200" />
}

export function EmailSalutation() {
  return (
    <Text className="m-0 text-gray-600">
      Thanks,
      <br />
      <br />
      Spotteur Team
    </Text>
  )
}
