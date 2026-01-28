// Audit routes

import { Request, Response } from 'express'
import { AuditRequest } from '../types.js'
import { PASSWORD, DEFAULT_URL } from '../config.js'
import { runUnlighthouseAudit, parseUnlighthouseResults } from '../services/unlighthouse.js'
import { sendAuditEmail, sendErrorNotificationEmail } from '../services/email.js'

export function auditTerrariawars(req: Request<object, object, AuditRequest>, res: Response): void {
  const { password, url } = req.body

  // Validate password
  if (!password) {
    res.status(400).json({ error: 'Missing password' })
    return
  }

  if (password !== PASSWORD) {
    res.status(401).json({ error: 'Invalid password' })
    return
  }

  const targetUrl = url || DEFAULT_URL
  
  // Start unlighthouse audit
  runUnlighthouseAudit(targetUrl, async (code: number | null, errorOutput?: string) => {
    if (code === 0) {
      // 正常完成，解析結果並發送郵件
      const result = parseUnlighthouseResults(targetUrl)
      if (result) {
        console.log('[Audit] Audit completed successfully, sending report')
        await sendAuditEmail(result)
      } else {
        // 結果解析失敗，發送錯誤通知
        console.error('[Audit] Failed to parse results, sending error notification')
        await sendErrorNotificationEmail(targetUrl, code, '審計完成但結果解析失敗')
      }
    } else {
      // Unlighthouse 執行失敗，但檢查是否有部分結果
      const result = parseUnlighthouseResults(targetUrl)
      if (result && result.pages.length > 0) {
        // 有部分結果，發送帶警告的審計報告
        console.log(`[Audit] Partial results available (${result.pages.length} pages), sending partial report with warning`)
        await sendAuditEmail(result, true, code)
      } else {
        // 完全沒有結果，發送錯誤通知
        console.error('[Audit] No results available, sending error notification')
        await sendErrorNotificationEmail(targetUrl, code, errorOutput)
      }
    }
  })

  // Return immediately with job started status
  res.json({
    status: 'started',
    message: `Audit started for ${targetUrl}`,
    note: 'Unlighthouse is running in the background. Email will be sent upon completion.'
  })
}

export function healthCheck(_req: Request, res: Response): void {
  res.json({ status: 'ok' })
}
