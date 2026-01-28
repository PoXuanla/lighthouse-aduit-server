export default {
  // Site URL will be overridden via CLI --site parameter
  site: 'https://terrariawars.com',
  
  scanner: {
    // Use mobile device
    device: 'mobile',
    
    // Maximum pages to scan
    maxRoutes: 200,
    
    // Exclude non-English language routes
    exclude: [
      '/zh-tw',
      '/zh-tw/**',
      '/zh-cn',
      '/zh-cn/**',
      '/ja',
      '/ja/**',
      // Exclude static assets
      '**/*.png',
      '**/*.jpg',
      '**/*.svg',
      '**/*.woff2',
      '/_nuxt/**',
      '/images/**',
      '/fonts/**',
      '/data/**',
      '/favicon/**',
    ],
    
    // Use sitemap for discovery
    sitemap: true,
    
    // Disable crawler to avoid Cloudflare blocks
    crawler: false,
    
    // Sample dynamic routes
    samples: 5,
  },
  
  // Only check performance and SEO
  lighthouseOptions: {
    onlyCategories: ['performance', 'seo'],
    
    // Mobile-specific throttling
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      cpuSlowdownMultiplier: 4,
    },
  },
  
  // Report configuration
  reporter: {
    json: true,
    html: true,
    csv: true,
  },
  
  // Output directory
  outputPath: '.unlighthouse',
  
  // CI mode thresholds
  ci: {
    budget: {
      performance: 80,  // Performance target: 80+
      seo: 90,          // SEO target: 90+
    },
  },
  
  debug: false,
}

