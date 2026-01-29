// Audit routes

import { Request, Response } from 'express'
import { AuditRequest } from '../types.js'
import { PASSWORD, DEFAULT_URL } from '../config.js'
import { runUnlighthouseAudit, parseUnlighthouseResults } from '../services/unlighthouse.js'
import { sendAuditEmail, sendErrorNotificationEmail } from '../services/email.js'
import { saveHtmlReport, getReportsList, getReportContent } from '../services/report.js'

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
        console.log('[Audit] Audit completed successfully, generating HTML report and sending email')
        // 生成 HTML 報告
        const { filepath: htmlReportPath, filename } = saveHtmlReport(result)
        console.log(`[Audit] HTML report saved: ${htmlReportPath}`)
        // 發送郵件（包含報告網址）
        await sendAuditEmail(result, false, null, filename)
      } else {
        // 結果解析失敗，發送錯誤通知
        console.error('[Audit] Failed to parse results, sending error notification')
        await sendErrorNotificationEmail(targetUrl, code, '審計完成但結果解析失敗')
      }
    } else {
      // Unlighthouse 執行失敗，但檢查是否有部分結果
      const result = parseUnlighthouseResults(targetUrl)
      if (result && result.pages.length > 0) {
        // 有部分結果，生成 HTML 報告並發送帶警告的郵件
        console.log(`[Audit] Partial results available (${result.pages.length} pages), generating HTML report and sending partial report`)
        // 生成 HTML 報告
        const { filepath: htmlReportPath, filename } = saveHtmlReport(result)
        console.log(`[Audit] Partial HTML report saved: ${htmlReportPath}`)
        // 發送部分結果郵件（包含報告網址）
        await sendAuditEmail(result, true, code, filename)
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

// 查看報告列表
export function viewReportsList(_req: Request, res: Response): void {
  try {
    const reports = getReportsList()
    
    if (reports.length === 0) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html lang="zh-TW">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>審計報告 - 無報告</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; margin: 0; }
            .container { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 25px rgba(0,0,0,0.1); max-width: 500px; margin: 0 auto; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>📊 尚無審計報告</h1>
            <p>請先執行審計以生成報告</p>
            <button onclick="triggerAudit()" style="background: #4f46e5; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">觸發審計</button>
            <script>
              function triggerAudit() {
                fetch('/audit/terrariawars', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ password: '123' })
                }).then(r => r.json()).then(data => {
                  alert('審計已開始：' + data.message)
                  setTimeout(() => location.reload(), 3000)
                })
              }
            </script>
          </div>
        </body>
        </html>
      `)
      return
    }
    
    // 生成報告列表頁面
    const reportItems = reports.map(report => `
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 12px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 4px 0; color: #334155;">
              <a href="/report/${report.filename}" style="color: #4f46e5; text-decoration: none;">${report.filename}</a>
            </h3>
            <p style="margin: 0; color: #64748b; font-size: 0.9rem;">
              生成時間: ${report.mtime.toLocaleString('zh-TW')} | 大小: ${(report.size / 1024).toFixed(1)} KB
            </p>
          </div>
          <a href="/report/${report.filename}" style="background: #4f46e5; color: white; padding: 8px 16px; border-radius: 6px; text-decoration: none; font-size: 0.9rem;">查看</a>
        </div>
      </div>
    `).join('')
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(`
      <!DOCTYPE html>
      <html lang="zh-TW">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>審計報告列表</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; }
          .container { max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; padding: 32px; box-shadow: 0 20px 25px rgba(0,0,0,0.1); }
          .header { text-align: center; margin-bottom: 32px; }
          .stats { background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="color: #334155; margin: 0 0 8px 0;">📊 審計報告歷史</h1>
            <p style="color: #64748b; margin: 0;">查看所有已生成的審計報告</p>
          </div>
          
          <div class="stats">
            <strong>總計 ${reports.length} 份報告</strong> | 
            <a href="/report/${reports[0].filename}" style="color: #4f46e5;">查看最新報告</a> | 
            <button onclick="triggerAudit()" style="background: #22c55e; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; margin-left: 8px;">觸發新審計</button>
          </div>
          
          <div>
            ${reportItems}
          </div>
        </div>
        
        <script>
          function triggerAudit() {
            fetch('/audit/terrariawars', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ password: '123' })
            }).then(r => r.json()).then(data => {
              alert('審計已開始：' + data.message)
              setTimeout(() => location.reload(), 5000)
            })
          }
        </script>
      </body>
      </html>
    `)
    
  } catch (error) {
    console.error('[Report] Error serving reports list:', error)
    res.status(500).send('載入報告列表時發生錯誤')
  }
}

// 查看指定的審計報告
export function viewSpecificReport(req: Request, res: Response): void {
  const filename = req.params.filename
  
  if (!filename || !filename.endsWith('.html')) {
    res.status(400).send('無效的檔案名稱')
    return
  }
  
  try {
    const htmlContent = getReportContent(filename)
    
    if (!htmlContent) {
      res.status(404).send(`
        <html>
          <head><title>報告不存在</title></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px;">
            <h1>❌ 找不到指定的報告</h1>
            <p>檔案：${filename}</p>
            <a href="/reports" style="color: #4f46e5;">返回報告列表</a>
          </body>
        </html>
      `)
      return
    }
    
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.send(htmlContent)
    
  } catch (error) {
    console.error('[Report] Error serving specific report:', error)
    res.status(500).send('載入報告時發生錯誤')
  }
}
