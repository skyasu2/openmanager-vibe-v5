import { test, expect } from '@playwright/test';

test.describe('Lighthouse 성능 측정', () => {
  test('Core Web Vitals 및 성능 지표 측정', async ({ page }) => {
    console.log('🚀 Lighthouse 성능 측정 시작');
    
    // Chrome DevTools Protocol을 통한 성능 메트릭 수집
    const client = await page.context().newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('Runtime.enable');
    
    const startTime = Date.now();
    
    // 메인 페이지 로드
    await page.goto('http://localhost:3001/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 페이지 완전 로드 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // 추가 안정화 시간
    
    const loadTime = Date.now() - startTime;
    console.log(`📊 전체 페이지 로드 시간: ${loadTime}ms`);
    
    // Performance metrics 수집
    const performanceMetrics = await client.send('Performance.getMetrics');
    const metrics = performanceMetrics.metrics.reduce((acc, metric) => {
      acc[metric.name] = metric.value;
      return acc;
    }, {} as Record<string, number>);
    
    // Core Web Vitals 관련 메트릭 추출 및 출력
    console.log('\n📈 Core Web Vitals 및 성능 지표:');
    
    if (metrics.FirstContentfulPaint) {
      const fcp = Math.round(metrics.FirstContentfulPaint * 1000);
      console.log(`🎨 First Contentful Paint (FCP): ${fcp}ms`);
      expect(fcp).toBeLessThan(3000); // 3초 이내
    }
    
    if (metrics.LargestContentfulPaint) {
      const lcp = Math.round(metrics.LargestContentfulPaint * 1000);
      console.log(`📏 Largest Contentful Paint (LCP): ${lcp}ms`);
      expect(lcp).toBeLessThan(4000); // 4초 이내
    }
    
    // Layout stability 측정
    const layoutShift = await page.evaluate(() => {
      return new Promise((resolve) => {
        let totalShift = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
              totalShift += (entry as any).value;
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
        
        setTimeout(() => {
          observer.disconnect();
          resolve(totalShift);
        }, 3000);
      });
    });
    
    console.log(`📐 Cumulative Layout Shift (CLS): ${Number(layoutShift).toFixed(4)}`);
    expect(Number(layoutShift)).toBeLessThan(0.1); // CLS < 0.1
    
    // 메모리 사용량 측정
    if (metrics.JSHeapUsedSize && metrics.JSHeapTotalSize) {
      const heapUsed = Math.round(metrics.JSHeapUsedSize / 1024 / 1024);
      const heapTotal = Math.round(metrics.JSHeapTotalSize / 1024 / 1024);
      console.log(`💾 JavaScript 힙 사용량: ${heapUsed}MB / ${heapTotal}MB`);
      expect(heapUsed).toBeLessThan(50); // 50MB 이내
    }
    
    // 네트워크 요청 분석
    const requests: any[] = [];
    page.on('request', request => {
      requests.push({
        url: request.url(),
        resourceType: request.resourceType(),
        method: request.method()
      });
    });
    
    await page.reload({ waitUntil: 'networkidle' });
    
    console.log(`\n🌐 네트워크 요청 분석:`);
    console.log(`📡 총 요청 수: ${requests.length}`);
    
    const resourceTypes = requests.reduce((acc, req) => {
      acc[req.resourceType] = (acc[req.resourceType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    Object.entries(resourceTypes).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}개`);
    });
    
    // 기본 성능 기준 확인
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로드
    expect(requests.length).toBeLessThan(50); // 50개 이내 요청
    
    console.log('\n✅ Lighthouse 성능 측정 완료');
    
    await client.detach();
  });

  test('접근성 및 SEO 기본 검증', async ({ page }) => {
    console.log('♿ 접근성 및 SEO 검증 시작');
    
    await page.goto('http://localhost:3001/', { waitUntil: 'networkidle' });
    
    // 기본 HTML 구조 검증
    const hasH1 = await page.locator('h1').count() > 0;
    console.log(`📝 H1 태그 존재: ${hasH1}`);
    
    // 이미지 alt 속성 검증
    const images = await page.locator('img').all();
    let imagesWithAlt = 0;
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      if (alt !== null && alt !== '') {
        imagesWithAlt++;
      }
    }
    console.log(`🖼️ Alt 속성 있는 이미지: ${imagesWithAlt}/${images.length}`);
    
    // 링크 텍스트 검증
    const links = await page.locator('a').all();
    let linksWithText = 0;
    for (const link of links) {
      const text = await link.textContent();
      if (text && text.trim().length > 0) {
        linksWithText++;
      }
    }
    console.log(`🔗 텍스트 있는 링크: ${linksWithText}/${links.length}`);
    
    // 메타 태그 검증
    const title = await page.title();
    const metaDescription = await page.getAttribute('meta[name="description"]', 'content');
    const metaKeywords = await page.getAttribute('meta[name="keywords"]', 'content');
    
    console.log(`📄 페이지 제목: ${title}`);
    console.log(`📝 메타 설명: ${metaDescription || '없음'}`);
    console.log(`🏷️ 메타 키워드: ${metaKeywords || '없음'}`);
    
    // 기본 접근성 요구사항 확인
    expect(title.length).toBeGreaterThan(0);
    if (images.length > 0) {
      expect(imagesWithAlt / images.length).toBeGreaterThan(0.8); // 80% 이상의 이미지에 alt 속성
    }
    
    console.log('✅ 접근성 및 SEO 검증 완료');
  });
});