// Type definitions for the audit server

export interface AuditRequest {
  password?: string
  url?: string
}

export interface PageResult {
  path: string
  score: number
  performance?: number
  seo?: number
}

export interface AuditResult {
  url: string
  timestamp: string
  summary: {
    performance: number
    seo: number
  }
  pages: PageResult[]
  failedPages: PageResult[]
}
