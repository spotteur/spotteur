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
          <Container className="max-w-[600px] mx-auto">
            <Section className="py-6 text-center">
              <Text className="m-0 text-2xl font-bold text-gray-900">Spotteur</Text>
            </Section>

            <Section className="bg-white rounded-lg shadow-sm overflow-hidden">
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
  return <Text className={cn('m-0 mb-4 text-gray-600 leading-relaxed', className)}>{children}</Text>
}

interface EmailSubtextProps {
  children: React.ReactNode
}

export function EmailSubtext({ children }: EmailSubtextProps) {
  return <Text className="m-0 text-gray-600 leading-relaxed text-sm">{children}</Text>
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
        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold no-underline inline-block"
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
