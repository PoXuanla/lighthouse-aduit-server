// Configuration constants and environment variables

export const PORT = Number(process.env.PORT) || 3000
export const PASSWORD = '123'
export const DEFAULT_URL = 'https://terrariawars.com'

// Gmail configuration
export const GMAIL_USER = process.env.GMAIL_USER
export const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD
export const GMAIL_TO = process.env.GMAIL_TO

// Server configuration
export const SERVER_URL = process.env.SERVER_URL || `http://localhost:${PORT}`
