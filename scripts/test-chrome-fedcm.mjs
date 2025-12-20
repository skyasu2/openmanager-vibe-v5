import { chromium } from 'playwright';

(async () => {
  // Config
  const BASE_URL = process.env.BASE_URL || 'https://openmanager-vibe-v5-l2fooslro-skyasus-projects.vercel.app';
  const HEADLESS = process.env.HEADLESS !== 'false';
  const TIMEOUT = 5000;

  console.log('=== Test Configuration ===');
  console.log(`URL: ${BASE_URL}`);
  console.log(`Headless: ${HEADLESS}`);
  console.log('==========================\n');

  async function runTest(browserName, options) {
    console.log(`=== Testing with ${browserName} ===`);
    let browser;
    try {
      browser = await chromium.launch(options);
      const context = await browser.newContext();
      const page = await context.newPage();

      // Collect logs
      const logs = [];
      page.on('console', msg => {
        logs.push({ type: msg.type(), text: msg.text() });
      });

      try {
        await page.goto(BASE_URL);
        await page.waitForTimeout(TIMEOUT);
      } catch (e) {
        console.error(`❌ Navigation failed: ${e.message}`);
        return { error: e.message, logs: [], count: 0 };
      }

      // Filter logs
      const warnings = logs.filter(log =>
        log.text.includes('FedCM') || log.text.includes('GSI_LOGGER')
      );

      console.log(`${browserName} - Total logs: ${logs.length}`);
      console.log(`${browserName} - FedCM warnings: ${warnings.length}`);
      
      warnings.forEach(log => {
        console.log(`  [${log.type}] ${log.text.substring(0, 100)}...`);
      });

      return { logs, warnings, count: warnings.length };
    } catch (e) {
      console.error(`❌ Browser launch failed: ${e.message}`);
      return { error: e.message, logs: [], count: 0 };
    } finally {
      if (browser) await browser.close();
    }
  }

  // Run Tests
  const chromeResult = await runTest('Chrome', { channel: 'chrome', headless: HEADLESS });
  console.log('');
  const chromiumResult = await runTest('Chromium', { headless: HEADLESS });

  // Compare
  console.log('\n=== Comparison ===');
  if (chromeResult.error || chromiumResult.error) {
    console.log('⚠️ Some tests failed to run properly.');
  } else {
    console.log(`FedCM warnings - Chrome: ${chromeResult.count}, Chromium: ${chromiumResult.count}`);
    if (chromeResult.count === chromiumResult.count) {
      console.log('✅ No difference between Chrome and Chromium');
    } else {
      console.log('⚠️ Difference detected!');
      const diff = Math.abs(chromiumResult.count - chromeResult.count);
      console.log(`Difference: ${diff} warnings`);
    }
  }

})();
