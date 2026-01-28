// Audit routes

import { Request, Response } from 'express'
import { AuditRequest } from '../types.js'
import { PASSWORD, DEFAULT_URL } from '../config.js'
import { runUnlighthouseAudit, parseUnlighthouseResults } from '../services/unlighthouse.js'
import { sendAuditEmail } from '../services/email.js'

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
  runUnlighthouseAudit(targetUrl, async (code: number | null) => {
    if (code === 0) {
      // Parse results and send email
      const result = parseUnlighthouseResults(targetUrl)
      if (result) {
        await sendAuditEmail(result)
      }
    } else {
      console.error('[Audit] Unlighthouse failed, skipping email')
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
