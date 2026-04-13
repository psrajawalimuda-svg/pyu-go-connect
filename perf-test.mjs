import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Wait for dev server
    console.log('Waiting for dev server...');
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    console.log('\n📊 Measuring performance...\n');
    
    const startTime = Date.now();
    await page.goto('http://localhost:8083', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    const navigationTime = Date.now() - startTime;
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0];
      const paintEntries = performance.getEntriesByType('paint');
      
      return {
        domInteractive: perfData?.domInteractive - perfData?.fetchStart,
        firstPaint: paintEntries.find(e => e.name === 'first-paint')?.startTime,
        firstContentfulPaint: paintEntries.find(e => e.name === 'first-contentful-paint')?.startTime,
        resourceCount: performance.getEntriesByType('resource').length,
        transferSize: Math.round(
          performance.getEntriesByType('resource')
            .reduce((sum, e) => sum + (e.transferSize || 0), 0) / 1024
        ),
      };
    });
    
    console.log('✅ Results:\n');
    console.log(`  ⏱️  Navigation Time:        ${navigationTime}ms`);
    console.log(`  ⏱️  First Paint:            ${metrics.firstPaint?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  First Contentful Paint: ${metrics.firstContentfulPaint?.toFixed(0) || 'N/A'}ms`);
    console.log(`  ⏱️  DOM Interactive:        ${metrics.domInteractive?.toFixed(0) || 'N/A'}ms`);
    console.log(`  📦 Resources:              ${metrics.resourceCount}`);
    console.log(`  📊 Transfer Size:          ${metrics.transferSize}KB\n`);
    
    const totalTime = Math.max(navigationTime, metrics.firstContentfulPaint || 0);
    if (totalTime < 3000) {
      console.log(`✨ GOAL ACHIEVED: ${totalTime}ms < 3000ms ✨\n`);
    } else {
      console.log(`⚠️  Time: ${totalTime}ms (target: <3000ms)\n`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await browser.close();
  }
})();
