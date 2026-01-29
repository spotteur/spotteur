'use server'

import nodemailer from 'nodemailer'
import type SMTPTransport from 'nodemailer/lib/smtp-transport'

import { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, SMTP_SECURE } from '@/constants/env'
import { logger } from '@/lib/logger'

const transportOptions = {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  ...(SMTP_USER && SMTP_PASSWORD
    ? {
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASSWORD,
        },
      }
    : {}),
} satisfies SMTPTransport.Options

const transporter = nodemailer.createTransport(transportOptions)

export async function sendEmail(to: string, subject: string, html: string, text: string) {
  try {
    const info = await transporter.sendMail({
      from: SMTP_FROM,
      to,
      subject,
      text,
      html,
    })
    return info
  } catch (error) {
    logger.error('Failed to send email', error)
    throw error
  }
}
