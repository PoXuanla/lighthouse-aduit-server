// Main server entry point

import 'dotenv/config'
import express from 'express'
import { PORT, GMAIL_USER, GMAIL_APP_PASSWORD, GMAIL_TO } from './config.js'
import { auditTerrariawars, healthCheck, viewReportsList, viewSpecificReport } from './routes/audit.js'

const app = express()

// Middleware
app.use(express.json())

// Routes
app.post('/audit/terrariawars', auditTerrariawars)
app.get('/health', healthCheck)
app.get('/reports', viewReportsList)
app.get('/report/:filename', viewSpecificReport)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Audit server running at http://localhost:${PORT}`)
  console.log(`📋 POST /audit/terrariawars - Run unlighthouse audit`)
  console.log(`❤️  GET /health - Health check`)
  console.log(`📊 GET /reports - View audit reports list`)
  console.log(`📄 GET /report/:filename - View specific audit report`)
  
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD || !GMAIL_TO) {
    console.log(`⚠️  Gmail not configured. Copy .env.example to .env and fill in credentials.`)
  } else {
    console.log(`📧 Email reports will be sent to: ${GMAIL_TO}`)
  }
})