// Unlighthouse audit service

import { spawn } from 'child_process'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { AuditResult, PageResult } from '../types.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Parse unlighthouse results from ci-result.json
export function parseUnlighthouseResults(targetUrl: string): AuditResult | null {
  const resultPath = path.resolve(__dirname, '..', '..', '.unlighthouse', 'ci-result.json')
  
  if (!fs.existsSync(resultPath)) {
    console.error('[Email] ci-result.json not found')
    return null
  }

  try {
    const data = JSON.parse(fs.readFileSync(resultPath, 'utf-8'))
    
    const pages: PageResult[] = []
    const failedPages: PageResult[] = []
    let totalPerformance = 0
    let totalSeo = 0
    let count = 0

    // Parse each route result
    if (data.routes && Array.isArray(data.routes)) {
      for (const route of data.routes) {
        const performance = route.report?.categories?.performance?.score ?? 0
        const seo = route.report?.categories?.seo?.score ?? 0
        
        const perfPercent = Math.round(performance * 100)
        const seoPercent = Math.round(seo * 100)
        
        const pageResult: PageResult = {
          path: route.path || route.route || 'unknown',
          score: Math.round((perfPercent + seoPercent) / 2),
          performance: perfPercent,
          seo: seoPercent
        }
        
        pages.push(pageResult)
        totalPerformance += perfPercent
        totalSeo += seoPercent
        count++

        // Check if failed budget
        if (perfPercent < 80 || seoPercent < 90) {
          failedPages.push(pageResult)
        }
      }
    }

    return {
      url: targetUrl,
      timestamp: new Date().toISOString(),
      summary: {
        performance: count > 0 ? Math.round(totalPerformance / count) : 0,
        seo: count > 0 ? Math.round(totalSeo / count) : 0
      },
      pages,
      failedPages
    }
  } catch (error) {
    console.error('[Email] Failed to parse ci-result.json:', error)
    return null
  }
}

// Run unlighthouse audit
export function runUnlighthouseAudit(targetUrl: string, onComplete: (code: number | null) => void): void {
  console.log(`[Audit] Starting unlighthouse audit for: ${targetUrl}`)

  // Spawn unlighthouse-ci process
  const configPath = path.resolve(__dirname, '..', '..', 'unlighthouse.config.ts')
  const unlighthouse = spawn('npx', [
    'unlighthouse-ci',
    '--site', targetUrl,
    '--config-file', configPath,
    '--device', 'mobile'
  ], {
    cwd: path.resolve(__dirname, '..', '..'),
    stdio: 'pipe',
    shell: true
  })

  unlighthouse.stdout.on('data', (data: Buffer) => {
    const output = data.toString()
    console.log(`[Unlighthouse] ${output}`)
  })

  unlighthouse.stderr.on('data', (data: Buffer) => {
    const output = data.toString()
    console.error(`[Unlighthouse Error] ${output}`)
  })

  unlighthouse.on('close', (code: number | null) => {
    console.log(`[Audit] Unlighthouse process exited with code ${code}`)
    onComplete(code)
  })
}
