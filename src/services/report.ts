// HTML 報告生成服務

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { AuditResult } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 生成 HTML 總覽報告
export function generateHtmlReport(result: AuditResult): string {
  const timestamp = new Date(result.timestamp).toLocaleString('zh-TW')
  
  // 計算統計數據
  const totalPages = result.pages.length
  const passedPages = result.pages.filter(p => (p.performance ?? 0) >= 80 && (p.seo ?? 0) >= 90).length
  const failedPages = result.failedPages.length
  const avgPerformance = result.summary.performance
  const avgSeo = result.summary.seo

  // 生成頁面表格
  let pagesTableRows = ''
  result.pages.forEach((page, index) => {
    const perfColor = (page.performance ?? 0) >= 80 ? '#22c55e' : '#ef4444'
    const seoColor = (page.seo ?? 0) >= 90 ? '#22c55e' : '#ef4444'
    const perfIcon = (page.performance ?? 0) >= 80 ? '✅' : '❌'
    const seoIcon = (page.seo ?? 0) >= 90 ? '✅' : '❌'
    const rowBg = index % 2 === 0 ? '#f9fafb' : '#ffffff'
    
    pagesTableRows += `
      <tr style="background-color: ${rowBg};">
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; font-weight: 500;">${page.path}</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${perfColor}; font-weight: bold; font-size: 16px;">${page.performance}</span>
          <span style="margin-left: 8px;">${perfIcon}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="color: ${seoColor}; font-weight: bold; font-size: 16px;">${page.seo}</span>
          <span style="margin-left: 8px;">${seoIcon}</span>
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          <span style="font-weight: bold; font-size: 16px;">${page.score}</span>
        </td>
      </tr>
    `
  })

  // 生成失敗頁面列表
  let failedPagesHtml = ''
  if (result.failedPages.length > 0) {
    const failedList = result.failedPages.map(p => 
      `<li style="margin-bottom: 8px;">
        <strong>${p.path}</strong> - 
        Performance: <span style="color: ${(p.performance ?? 0) >= 80 ? '#22c55e' : '#ef4444'};">${p.performance}</span>, 
        SEO: <span style="color: ${(p.seo ?? 0) >= 90 ? '#22c55e' : '#ef4444'};">${p.seo}</span>
      </li>`
    ).join('')
    
    failedPagesHtml = `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 20px; margin: 24px 0;">
        <h3 style="color: #dc2626; margin-top: 0; margin-bottom: 16px; display: flex; align-items: center;">
          ⚠️ 需要改進的頁面 (${failedPages})
        </h3>
        <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
          ${failedList}
        </ul>
      </div>
    `
  }

  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lighthouse 審計報告 - ${result.url}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
          margin: 0;
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
        }
        .container {
          max-width: 1200px;
          margin: 0 auto;
          background: white;
          border-radius: 16px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          overflow: hidden;
        }
        .header {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          padding: 32px;
          text-align: center;
        }
        .header h1 {
          margin: 0 0 8px 0;
          font-size: 2.5rem;
          font-weight: 700;
        }
        .header p {
          margin: 0;
          font-size: 1.1rem;
          opacity: 0.9;
        }
        .content {
          padding: 32px;
        }
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        .stat-card {
          background: #f8fafc;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
          border: 2px solid #e2e8f0;
          transition: all 0.3s ease;
        }
        .stat-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 25px -3px rgba(0, 0, 0, 0.1);
        }
        .stat-value {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 8px;
        }
        .stat-label {
          color: #64748b;
          font-size: 0.9rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .table-container {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          margin-top: 24px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th {
          background: #f1f5f9;
          padding: 16px 12px;
          text-align: left;
          font-weight: 600;
          color: #334155;
          border-bottom: 2px solid #e2e8f0;
        }
        th:nth-child(2), th:nth-child(3), th:nth-child(4) {
          text-align: center;
        }
        .performance-good { color: #22c55e; }
        .performance-bad { color: #ef4444; }
        .seo-good { color: #22c55e; }
        .seo-bad { color: #ef4444; }
        .refresh-btn {
          background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 24px;
        }
        .refresh-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px -8px rgba(79, 70, 229, 0.5);
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔍 Lighthouse 審計報告</h1>
          <p><strong>網站:</strong> ${result.url}</p>
          <p><strong>審計時間:</strong> ${timestamp}</p>
        </div>
        
        <div class="content">
          <button class="refresh-btn" onclick="window.location.reload()">🔄 重新整理報告</button>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value" style="color: ${avgPerformance >= 80 ? '#22c55e' : '#ef4444'};">
                ${avgPerformance}
              </div>
              <div class="stat-label">平均效能分數</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: ${avgSeo >= 90 ? '#22c55e' : '#ef4444'};">
                ${avgSeo}
              </div>
              <div class="stat-label">平均 SEO 分數</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: #3b82f6;">
                ${totalPages}
              </div>
              <div class="stat-label">總頁面數</div>
            </div>
            <div class="stat-card">
              <div class="stat-value" style="color: ${failedPages === 0 ? '#22c55e' : '#ef4444'};">
                ${failedPages}
              </div>
              <div class="stat-label">需要改進</div>
            </div>
          </div>

          ${failedPagesHtml}

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>頁面路徑</th>
                  <th>效能分數</th>
                  <th>SEO 分數</th>
                  <th>總分</th>
                </tr>
              </thead>
              <tbody>
                ${pagesTableRows}
              </tbody>
            </table>
          </div>

          <div style="margin-top: 32px; padding: 20px; background: #f8fafc; border-radius: 12px; text-align: center; color: #64748b;">
            <p style="margin: 0; font-size: 0.9rem;">
              📊 由 Audit Server 生成 • 🚀 基於 Unlighthouse 技術 • 
              ⚡ 門檻：效能 ≥ 80，SEO ≥ 90
            </p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

// 儲存 HTML 報告到檔案（使用 .unlighthouse 目錄以支援 Zeabur Volume 掛載）
export function saveHtmlReport(result: AuditResult): { filepath: string, filename: string } {
  const htmlContent = generateHtmlReport(result)
  
  // 使用 .unlighthouse/reports 目錄，與 Zeabur Volume 掛載路徑一致
  const reportDir = path.resolve('.unlighthouse', 'reports')
  
  // 確保目錄存在
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  // 生成檔案名稱（包含時間戳）
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const filename = `audit-report-${timestamp}.html`
  const filepath = path.join(reportDir, filename)
  
  // 儲存 HTML 檔案
  fs.writeFileSync(filepath, htmlContent, 'utf-8')
  
  console.log(`[Report] HTML 報告已儲存: ${filepath}`)
  return { filepath, filename }
}

// 獲取所有報告列表
export function getReportsList(): Array<{ filename: string, mtime: Date, size: number }> {
  const reportDir = path.resolve('.unlighthouse', 'reports')
  
  if (!fs.existsSync(reportDir)) {
    return []
  }
  
  try {
    const files = fs.readdirSync(reportDir)
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const filepath = path.join(reportDir, file)
        const stats = fs.statSync(filepath)
        return {
          filename: file,
          mtime: stats.mtime,
          size: stats.size
        }
      })
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime()) // 最新的在前
    
    return files
  } catch (error) {
    console.error('[Report] Error reading reports directory:', error)
    return []
  }
}

// 讀取指定報告檔案
export function getReportContent(filename: string): string | null {
  const reportDir = path.resolve('.unlighthouse', 'reports')
  const filepath = path.join(reportDir, filename)
  
  try {
    if (fs.existsSync(filepath) && filename.endsWith('.html')) {
      return fs.readFileSync(filepath, 'utf-8')
    }
  } catch (error) {
    console.error('[Report] Error reading report file:', error)
  }
  
  return null
}
