import { chromium } from 'playwright';
import lighthouse from 'lighthouse';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';

async function runLighthouseAudit() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--remote-debugging-port=9222']
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 메인 페이지로 이동
  await page.goto('http://localhost:3000/main', { waitUntil: 'networkidle' });
  
  // Lighthouse 실행
  const result = await lighthouse('http://localhost:3000/main', {
    port: 9222,
    output: 'json',
    onlyCategories: ['performance'],
    throttling: {
      cpuSlowdownMultiplier: 4,
      rttMs: 150,
      throughputKbps: 1638.4,
    }
  });

  await browser.close();

  // 결과 저장
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(process.cwd(), `lighthouse-report-${timestamp}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result.lhr, null, 2));

  // 주요 메트릭 출력
  const metrics = result.lhr.audits;
  console.log('\n🎯 Core Web Vitals 측정 결과:\n');
  console.log(`LCP (Largest Contentful Paint): ${metrics['largest-contentful-paint'].displayValue}`);
  console.log(`FID (First Input Delay): ${metrics['max-potential-fid'].displayValue}`);
  console.log(`CLS (Cumulative Layout Shift): ${metrics['cumulative-layout-shift'].displayValue}`);
  console.log(`FCP (First Contentful Paint): ${metrics['first-contentful-paint'].displayValue}`);
  console.log(`TTI (Time to Interactive): ${metrics['interactive'].displayValue}`);
  console.log(`TBT (Total Blocking Time): ${metrics['total-blocking-time'].displayValue}`);
  console.log(`\n📊 Performance Score: ${result.lhr.categories.performance.score * 100}/100`);

  // 번들 사이즈 분석
  const jsFiles = result.lhr.audits['network-requests'].details.items.filter(
    item => item.resourceType === 'Script'
  );
  
  const totalJsSize = jsFiles.reduce((sum, file) => sum + (file.transferSize || 0), 0);
  console.log(`\n📦 JavaScript 번들 사이즈: ${(totalJsSize / 1024).toFixed(2)} KB`);
  
  // 개선 제안
  console.log('\n💡 개선 제안:');
  const opportunities = result.lhr.audits;
  
  if (parseFloat(metrics['largest-contentful-paint'].numericValue) > 2500) {
    console.log('- LCP 개선 필요: 이미지 최적화, 크리티컬 리소스 우선순위 조정');
  }
  
  if (parseFloat(metrics['total-blocking-time'].numericValue) > 300) {
    console.log('- TBT 개선 필요: JavaScript 실행 최적화, 코드 스플리팅 강화');
  }
  
  if (totalJsSize > 250 * 1024) {
    console.log('- 번들 사이즈 축소 필요: 불필요한 의존성 제거, 트리 쉐이킹 최적화');
  }

  return result.lhr;
}

runLighthouseAudit().catch(console.error);