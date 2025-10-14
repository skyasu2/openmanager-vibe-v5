import { chromium } from 'playwright';

(async () => {
  // Test with Chrome
  console.log('=== Testing with Chrome ===');
  const browserChrome = await chromium.launch({
    channel: 'chrome',
    headless: false
  });

  const contextChrome = await browserChrome.newContext();
  const pageChrome = await contextChrome.newPage();

  // Collect console logs
  const logsChrome = [];
  pageChrome.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logsChrome.push({ type, text });
  });

  await pageChrome.goto('https://openmanager-vibe-v5-l2fooslro-skyasus-projects.vercel.app');
  await pageChrome.waitForTimeout(5000);

  // Count FedCM warnings
  const fedcmWarningsChrome = logsChrome.filter(log =>
    log.text.includes('FedCM') || log.text.includes('GSI_LOGGER')
  );

  console.log(`Chrome - Total logs: ${logsChrome.length}`);
  console.log(`Chrome - FedCM warnings: ${fedcmWarningsChrome.length}`);
  fedcmWarningsChrome.forEach(log => {
    console.log(`  [${log.type}] ${log.text.substring(0, 100)}...`);
  });

  await browserChrome.close();

  // Test with Chromium
  console.log('\n=== Testing with Chromium ===');
  const browserChromium = await chromium.launch({
    headless: false
  });

  const contextChromium = await browserChromium.newContext();
  const pageChromium = await contextChromium.newPage();

  // Collect console logs
  const logsChromium = [];
  pageChromium.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    logsChromium.push({ type, text });
  });

  await pageChromium.goto('https://openmanager-vibe-v5-l2fooslro-skyasus-projects.vercel.app');
  await pageChromium.waitForTimeout(5000);

  // Count FedCM warnings
  const fedcmWarningsChromium = logsChromium.filter(log =>
    log.text.includes('FedCM') || log.text.includes('GSI_LOGGER')
  );

  console.log(`Chromium - Total logs: ${logsChromium.length}`);
  console.log(`Chromium - FedCM warnings: ${fedcmWarningsChromium.length}`);
  fedcmWarningsChromium.forEach(log => {
    console.log(`  [${log.type}] ${log.text.substring(0, 100)}...`);
  });

  await browserChromium.close();

  // Compare
  console.log('\n=== Comparison ===');
  console.log(`FedCM warnings - Chrome: ${fedcmWarningsChrome.length}, Chromium: ${fedcmWarningsChromium.length}`);

  if (fedcmWarningsChrome.length === fedcmWarningsChromium.length) {
    console.log('✅ No difference between Chrome and Chromium');
  } else {
    console.log('⚠️ Difference detected!');
    console.log(`Improvement: ${fedcmWarningsChromium.length - fedcmWarningsChrome.length} warnings`);
  }
})();
