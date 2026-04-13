const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Wait for dev server to be ready
    console.log('Waiting for dev server to be ready...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Navigate and measure performance
    console.log('\n📊 Starting performance measurement...\n');
    
    const startTime = Date.now();
    await page.goto('http://localhost:8082', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const navigationTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        // Navigation timings
        domContentLoaded: perfData?.domContentLoadedEventEnd - perfData?.domContentLoadedEventStart,
        loadComplete: perfData?.loadEventEnd - perfData?.loadEventStart,
        domInteractive: perfData?.domInteractive - perfData?.fetchStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
        
        // Resource timing
        resourceCount: performance.getEntriesByType('resource').length,
        transferSize: Math.round(
          performance.getEntriesByType('resource')
            .reduce((sum, e) => sum + (e.transferSize || 0), 0) / 1024
        ),
        
        // Total timing
        navigationStart: 0,
        responseEnd: perfData?.responseEnd - perfData?.fetchStart,
      };
    });
    
    // Measure visible content
    const isPageLoaded = await page.evaluate(() => {
      return document.readyState === 'complete';
    });
    
    console.log('✅ Performance Metrics:\n');
    console.log(`  ⏱️  Page Navigation Time:        ${navigationTime}ms`);
    console.log(`  ⏱️  First Paint (FP):            ${metrics.firstPaint?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  First Contentful Paint (FCP): ${metrics.firstContentfulPaint?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  DOM Content Loaded:          ${metrics.domContentLoaded?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  Load Event Complete:         ${metrics.loadComplete?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  DOM Interactive Time:        ${metrics.domInteractive?.toFixed(0) || 'N/A'}ms`);
    console.log(`  📦 Resources Loaded:            ${metrics.resourceCount}`);
    console.log(`  📊 Transfer Size:               ${metrics.transferSize}KB\n`);
    
    // Check if under 3 seconds
    const totalTime = Math.max(navigationTime, metrics.firstContentfulPaint || 0);
    if (totalTime < 3000) {
      console.log(`✨ GOAL ACHIEVED: ${totalTime}ms < 3000ms ✨\n`);
    } else {
      console.log(`⚠️  Current time: ${totalTime}ms (target: <3000ms)\n`);
    }
    
    // Take screenshot
    await page.screenshot({ path: 'performance-screenshot.png', fullPage: true });
    console.log('📸 Screenshot saved: performance-screenshot.png\n');
    
  } catch (error) {
    console.error('❌ Error during performance measurement:', error.message);
  } finally {
    await browser.close();
  }
})();
