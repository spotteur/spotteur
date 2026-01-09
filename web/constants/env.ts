export const APP_ENV = process.env.APP_ENV || 'production'

export const DB_HOST = process.env.DB_HOST || ''
export const DB_PORT = Number(process.env.DB_PORT || '0')
export const DB_USER = process.env.DB_USER || ''
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_NAME = process.env.DB_NAME || ''

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || ''
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || ''

export const S3_HOST = process.env.S3_HOST || ''
export const S3_PORT = Number(process.env.S3_PORT || '0')
export const S3_ENDPOINT = process.env.S3_ENDPOINT || `${S3_HOST}${S3_PORT ? `:${S3_PORT}` : ''}`
export const S3_REGION = process.env.S3_REGION || ''
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ''
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''
export const S3_BUCKET = process.env.S3_BUCKET || ''

export const PUBLIC_S3_HOST = process.env.PUBLIC_S3_HOST || ''
export const PUBLIC_S3_PORT = Number(process.env.PUBLIC_S3_PORT || '0')
export const PUBLIC_S3_ENDPOINT =
  process.env.PUBLIC_S3_ENDPOINT || `${PUBLIC_S3_HOST}${PUBLIC_S3_PORT ? `:${PUBLIC_S3_PORT}` : ''}`

export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = Number(process.env.SMTP_PORT || '587')
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ''
export const SMTP_FROM = process.env.SMTP_FROM || ''
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465
