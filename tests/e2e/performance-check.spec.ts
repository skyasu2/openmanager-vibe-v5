import { test, expect } from '@playwright/test';
import { ensureVercelBypassCookie } from './helpers/security';

/**
 * 프론트엔드 성능 종합 검증 테스트
 * Core Web Vitals, 메모리 사용량, 네트워크 성능 등을 측정
 */

test.describe('프론트엔드 성능 종합 검증', () => {
  test.beforeEach(async ({ page }) => {
    await ensureVercelBypassCookie(page);
  });
  
  test('Core Web Vitals 및 성능 메트릭 측정', async ({ page }) => {
    console.log('⚡ === 성능 측정 시작 ===');
    
    // 성능 메트릭 수집을 위한 설정
    await page.addInitScript(() => {
      // Web Vitals 측정을 위한 Observer 설정
      window.performanceMetrics = {
        lcp: 0,
        fid: 0,
        cls: 0,
        ttfb: 0,
        fcp: 0,
        resourceTiming: []
      };
      
      // LCP (Largest Contentful Paint) 측정
      if ('PerformanceObserver' in window) {
        try {
          const lcpObserver = new PerformanceObserver((entryList) => {
            const entries = entryList.getEntries();
            const lcpEntry = entries[entries.length - 1];
            window.performanceMetrics.lcp = lcpEntry.startTime;
          });
          lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
          
          // FCP (First Contentful Paint) 측정
          const fcpObserver = new PerformanceObserver((entryList) => {
            for (const entry of entryList.getEntries()) {
              if (entry.name === 'first-contentful-paint') {
                window.performanceMetrics.fcp = entry.startTime;
              }
            }
          });
          fcpObserver.observe({ entryTypes: ['paint'] });
          
          // CLS (Cumulative Layout Shift) 측정
          const clsObserver = new PerformanceObserver((entryList) => {
            let clsValue = 0;
            for (const entry of entryList.getEntries()) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            window.performanceMetrics.cls = clsValue;
          });
          clsObserver.observe({ entryTypes: ['layout-shift'] });
          
        } catch (error) {
          console.log('Performance Observer 초기화 오류:', error);
        }
      }
    });

    const startTime = Date.now();
    
    // 페이지 로딩
    console.log('🌐 페이지 로딩 시작...');
    const response = await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    const loadTime = Date.now() - startTime;
    console.log(`⏱️ 페이지 로딩 시간: ${loadTime}ms`);
    
    // HTTP 응답 확인
    const status = response?.status() || 0;
    console.log(`📊 HTTP 상태 코드: ${status}`);
    expect(status).toBeLessThan(400);
    
    // DOM 로딩 대기
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // 성능 메트릭 수집 대기
    
    // Core Web Vitals 메트릭 수집
    const metrics = await page.evaluate(async () => {
      // Navigation Timing API를 통한 기본 메트릭
      const navTiming = performance.getEntriesByType('navigation')[0];
      const paintTimings = performance.getEntriesByType('paint');
      
      let fcp = 0, lcp = 0;
      for (const timing of paintTimings) {
        if (timing.name === 'first-contentful-paint') {
          fcp = timing.startTime;
        }
      }
      
      // LCP 메트릭 (PerformanceObserver에서 수집한 값 우선 사용)
      lcp = window.performanceMetrics?.lcp || 0;
      
      return {
        // Core Web Vitals
        lcp: Math.round(lcp),
        fcp: Math.round(fcp),
        cls: window.performanceMetrics?.cls || 0,
        
        // Navigation Timing
        ttfb: Math.round(navTiming.responseStart - navTiming.requestStart),
        domContentLoaded: Math.round(navTiming.domContentLoadedEventEnd - navTiming.navigationStart),
        loadComplete: Math.round(navTiming.loadEventEnd - navTiming.navigationStart),
        
        // Resource Timing
        resourceCount: performance.getEntriesByType('resource').length,
        
        // Memory (Chrome only)
        memory: (performance as any).memory ? {
          usedJSHeapSize: Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024),
          totalJSHeapSize: Math.round((performance as any).memory.totalJSHeapSize / 1024 / 1024),
          jsHeapSizeLimit: Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)
        } : null
      };
    });
    
    console.log('\n📊 === Core Web Vitals 결과 ===');
    console.log(`🎯 LCP (Largest Contentful Paint): ${metrics.lcp}ms ${metrics.lcp <= 2500 ? '✅' : '⚠️'}`);
    console.log(`🚀 FCP (First Contentful Paint): ${metrics.fcp}ms ${metrics.fcp <= 1800 ? '✅' : '⚠️'}`);
    console.log(`📐 CLS (Cumulative Layout Shift): ${metrics.cls.toFixed(3)} ${metrics.cls <= 0.1 ? '✅' : '⚠️'}`);
    console.log(`⚡ TTFB (Time to First Byte): ${metrics.ttfb}ms ${metrics.ttfb <= 800 ? '✅' : '⚠️'}`);
    
    console.log('\n🔄 === Navigation Timing ===');
    console.log(`📄 DOM Content Loaded: ${metrics.domContentLoaded}ms`);
    console.log(`✅ Load Complete: ${metrics.loadComplete}ms`);
    console.log(`📦 Resource Count: ${metrics.resourceCount}개`);
    
    if (metrics.memory) {
      console.log('\n🧠 === JavaScript 메모리 사용량 ===');
      console.log(`📊 사용 중인 힙: ${metrics.memory.usedJSHeapSize}MB`);
      console.log(`📈 총 힙 크기: ${metrics.memory.totalJSHeapSize}MB`);
      console.log(`🔒 힙 크기 제한: ${metrics.memory.jsHeapSizeLimit}MB`);
      console.log(`📊 메모리 사용률: ${Math.round((metrics.memory.usedJSHeapSize / metrics.memory.totalJSHeapSize) * 100)}%`);
    }
    
    // DOM 요소 분석
    const domStats = await page.evaluate(() => {
      return {
        totalElements: document.querySelectorAll('*').length,
        visibleElements: Array.from(document.querySelectorAll('*')).filter(el => {
          const style = window.getComputedStyle(el);
          return style.display !== 'none' && style.visibility !== 'hidden';
        }).length,
        images: document.querySelectorAll('img').length,
        scripts: document.querySelectorAll('script').length,
        stylesheets: document.querySelectorAll('link[rel="stylesheet"]').length,
        bodyText: document.body.innerText.length
      };
    });
    
    console.log('\n🏗️ === DOM 분석 ===');
    console.log(`🧩 총 DOM 요소: ${domStats.totalElements}개`);
    console.log(`👀 표시되는 요소: ${domStats.visibleElements}개`);
    console.log(`🖼️ 이미지: ${domStats.images}개`);
    console.log(`📜 스크립트: ${domStats.scripts}개`);
    console.log(`🎨 스타일시트: ${domStats.stylesheets}개`);
    console.log(`📝 텍스트 길이: ${domStats.bodyText}자`);
    
    // 네트워크 요청 분석
    const networkStats = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      const networkStats = {
        total: resources.length,
        js: 0,
        css: 0,
        images: 0,
        xhr: 0,
        other: 0,
        totalSize: 0,
        avgDuration: 0
      };
      
      let totalDuration = 0;
      resources.forEach(resource => {
        const size = (resource as any).transferSize || 0;
        networkStats.totalSize += size;
        totalDuration += resource.duration;
        
        if (resource.name.includes('.js')) networkStats.js++;
        else if (resource.name.includes('.css')) networkStats.css++;
        else if (resource.name.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)) networkStats.images++;
        else if ((resource as any).initiatorType === 'xmlhttprequest' || (resource as any).initiatorType === 'fetch') networkStats.xhr++;
        else networkStats.other++;
      });
      
      networkStats.avgDuration = Math.round(totalDuration / resources.length);
      networkStats.totalSize = Math.round(networkStats.totalSize / 1024); // KB로 변환
      
      return networkStats;
    });
    
    console.log('\n🌐 === 네트워크 분석 ===');
    console.log(`📦 총 요청: ${networkStats.total}개`);
    console.log(`📜 JavaScript: ${networkStats.js}개`);
    console.log(`🎨 CSS: ${networkStats.css}개`);
    console.log(`🖼️ 이미지: ${networkStats.images}개`);
    console.log(`🔄 XHR/Fetch: ${networkStats.xhr}개`);
    console.log(`📄 기타: ${networkStats.other}개`);
    console.log(`📊 총 전송 크기: ${networkStats.totalSize}KB`);
    console.log(`⏱️ 평균 요청 시간: ${networkStats.avgDuration}ms`);
    
    // 성능 기준 검증
    console.log('\n🎯 === 성능 기준 검증 ===');
    
    const performanceScore = {
      lcp: metrics.lcp <= 2500,
      fcp: metrics.fcp <= 1800,
      cls: metrics.cls <= 0.1,
      ttfb: metrics.ttfb <= 800,
      loadTime: loadTime <= 3000
    };
    
    const passedTests = Object.values(performanceScore).filter(Boolean).length;
    const totalTests = Object.keys(performanceScore).length;
    const scorePercentage = Math.round((passedTests / totalTests) * 100);
    
    console.log(`📊 성능 점수: ${passedTests}/${totalTests} (${scorePercentage}%)`);
    console.log(`${scorePercentage >= 80 ? '🟢' : scorePercentage >= 60 ? '🟡' : '🔴'} 전체적인 성능 평가: ${
      scorePercentage >= 80 ? '우수' : scorePercentage >= 60 ? '보통' : '개선 필요'
    }`);
    
    // 기본적인 성능 기준 만족 여부 검증
    expect(loadTime).toBeLessThan(5000); // 5초 이내 로딩
    expect(metrics.resourceCount).toBeGreaterThan(0); // 리소스 로딩 확인
    expect(domStats.totalElements).toBeGreaterThan(10); // DOM 구조 존재 확인
    
    console.log('\n✅ === 성능 검증 완료 ===');
  });
  
  test('반응형 및 뷰포트 성능 확인', async ({ page }) => {
    console.log('📱 === 반응형 성능 테스트 시작 ===');
    
    const viewports = [
      { name: '모바일', width: 375, height: 667 },
      { name: '태블릿', width: 768, height: 1024 },
      { name: '데스크탑', width: 1920, height: 1080 }
    ];
    
    for (const viewport of viewports) {
      console.log(`\n📐 ${viewport.name} (${viewport.width}x${viewport.height}) 테스트`);
      
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
      
      const loadTime = await page.evaluate(() => {
        const start = performance.timeOrigin;
        return Date.now() - start;
      });
      
      const isResponsive = await page.evaluate(() => {
        const body = document.body;
        const hasOverflowX = body.scrollWidth > window.innerWidth;
        const hasVerticalScroll = body.scrollHeight > window.innerHeight;
        
        return {
          hasOverflowX,
          hasVerticalScroll,
          bodyWidth: body.scrollWidth,
          viewportWidth: window.innerWidth,
          bodyHeight: body.scrollHeight,
          viewportHeight: window.innerHeight
        };
      });
      
      console.log(`  ⏱️ 로딩 시간: ${loadTime}ms`);
      console.log(`  📏 가로 스크롤: ${isResponsive.hasOverflowX ? '⚠️ 있음' : '✅ 없음'}`);
      console.log(`  📏 세로 스크롤: ${isResponsive.hasVerticalScroll ? '✅ 있음' : '✅ 없음'}`);
      console.log(`  📐 콘텐츠 크기: ${isResponsive.bodyWidth}x${isResponsive.bodyHeight}px`);
      
      // 가로 스크롤이 있으면 반응형 디자인에 문제가 있을 수 있음
      if (isResponsive.hasOverflowX) {
        console.log(`  ⚠️ 주의: 가로 스크롤이 발생했습니다 (${isResponsive.bodyWidth}px > ${isResponsive.viewportWidth}px)`);
      }
    }
    
    console.log('\n✅ === 반응형 성능 테스트 완료 ===');
  });
});
