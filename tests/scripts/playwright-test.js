const { chromium } = require("playwright");
(async () => {
  console.log("Playwright GUI 테스트 시작...");
  const browser = await chromium.launch({ 
    headless: false, 
    args: ["--no-sandbox", "--disable-dev-shm-usage"] 
  });
  const page = await browser.newPage();
  await page.goto("https://google.com");
  await page.screenshot({ path: "playwright-test.png" });
  await browser.close();
  console.log("✅ Playwright GUI 테스트 성공!");
})().catch(console.error);
