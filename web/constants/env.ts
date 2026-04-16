export const APP_ENV = process.env.APP_ENV || 'production'
export const APP_URL = process.env.APP_URL || ''

export const DB_HOST = process.env.DB_HOST || ''
export const DB_PORT = Number(process.env.DB_PORT || '0')
export const DB_USER = process.env.DB_USER || ''
export const DB_PASSWORD = process.env.DB_PASSWORD || ''
export const DB_NAME = process.env.DB_NAME || ''

export const BETTER_AUTH_SECRET = process.env.BETTER_AUTH_SECRET || ''
export const BETTER_AUTH_URL = process.env.BETTER_AUTH_URL || APP_URL || ''

export const S3_HOST = process.env.S3_HOST || ''
export const S3_PORT = Number(process.env.S3_PORT || '0')
export const S3_ENDPOINT = process.env.S3_ENDPOINT || `${S3_HOST}${S3_PORT ? `:${S3_PORT}` : ''}` || ''
export const S3_REGION = process.env.S3_REGION || 'us-east-1'
export const S3_ACCESS_KEY = process.env.S3_ACCESS_KEY || ''
export const S3_SECRET_KEY = process.env.S3_SECRET_KEY || ''
export const S3_BUCKET = process.env.S3_BUCKET || ''

export const SMTP_HOST = process.env.SMTP_HOST || ''
export const SMTP_PORT = Number(process.env.SMTP_PORT || '587')
export const SMTP_USER = process.env.SMTP_USER || ''
export const SMTP_PASSWORD = process.env.SMTP_PASSWORD || ''
export const SMTP_FROM = process.env.SMTP_FROM || ''
export const SMTP_SECURE = process.env.SMTP_SECURE === 'true' || SMTP_PORT === 465

export const NOVU_SECRET_KEY = process.env.NOVU_SECRET_KEY || 'invalid-novu-secret-key'
export const NOVU_APP_IDENTIFIER = process.env.NOVU_APP_IDENTIFIER || ''
export const NOVU_BACKEND_URL = process.env.NOVU_BACKEND_URL || 'https://api.novu.co'
export const NOVU_WS_URL = process.env.NOVU_WS_URL || 'wss://ws.novu.co'

export const TEMPORAL_ADDRESS = process.env.TEMPORAL_ADDRESS || 'temporal:7233'
export const TEMPORAL_DEFAULT_STORAGE_DIR = process.env.TEMPORAL_DEFAULT_STORAGE_DIR || '/storage'

export const SELENIUM_REMOTE_URL = process.env.SELENIUM_REMOTE_URL || ''

export const TRUSTED_ORIGINS = (process.env.TRUSTED_ORIGINS || APP_URL || '').split(',').map((origin) => origin.trim())

export const DISABLE_REGISTRATION = process.env.APP_DISABLE_REGISTRATION === 'true'

export const BROWSER_ENGINE_TYPE = process.env.BROWSER_ENGINE_TYPE || ''

export const BROWSERLESS_WS_ENDPOINT = process.env.BROWSERLESS_WS_ENDPOINT || ''
export const BROWSERLESS_TOKEN = process.env.BROWSERLESS_TOKEN || ''

export const PLAYWRIGHT_CHROME_URL = process.env.PLAYWRIGHT_CHROME_URL || ''
export const PLAYWRIGHT_EDGE_URL = process.env.PLAYWRIGHT_EDGE_URL || ''
export const PLAYWRIGHT_FIREFOX_URL = process.env.PLAYWRIGHT_FIREFOX_URL || ''
