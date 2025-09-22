const { chromium } = require('playwright');

(async () => {
  console.log('🔍 Playwright 브라우저 테스트 시작...');
  
  try {
    // WSL2 환경에 맞는 브라우저 옵션
    const browser = await chromium.launch({
      headless: false,  // GUI 테스트
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox', 
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    const page = await browser.newPage();
    console.log('✅ 브라우저 시작 성공');
    
    await page.goto('https://www.google.com', { timeout: 10000 });
    console.log('✅ Google 페이지 로드 성공');
    
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    await browser.close();
    console.log('✅ 브라우저 종료 완료');
    console.log('🎉 Playwright 테스트 성공!');
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    process.exit(1);
  }
})();
