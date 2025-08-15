#!/usr/bin/env node

/**
 * 🎯 Core Web Vitals 분석 도구
 * 
 * Lighthouse를 사용하여 성능 지표를 측정하고 개선 방안을 제시합니다.
 */

const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

const config = {
  url: 'http://localhost:3000',
  port: 3000,
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices'],
  settings: {
    onlyAudits: [
      'first-contentful-paint',
      'largest-contentful-paint',
      'cumulative-layout-shift',
      'total-blocking-time',
      'speed-index',
      'interactive',
      'first-meaningful-paint'
    ]
  }
};

async function runLighthouseAnalysis() {
  console.log('🚀 Core Web Vitals 분석 시작...');
  
  let chrome;
  try {
    // Chrome 실행
    chrome = await chromeLauncher.launch({
      chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox']
    });
    
    // Lighthouse 실행
    const results = await lighthouse(config.url, {
      ...config,
      port: chrome.port,
    });
    
    // 결과 파싱
    const metrics = extractMetrics(results.lhr);
    const recommendations = generateRecommendations(metrics);
    
    // 결과 출력
    displayResults(metrics, recommendations);
    
    // 보고서 저장
    await saveReport(results.report, metrics, recommendations);
    
  } catch (error) {
    console.error('❌ 분석 실행 중 오류:', error.message);
  } finally {
    if (chrome) {
      await chrome.kill();
    }
  }
}

function extractMetrics(lhr) {
  const audits = lhr.audits;
  
  return {
    // Core Web Vitals
    lcp: {
      value: audits['largest-contentful-paint'].numericValue,
      displayValue: audits['largest-contentful-paint'].displayValue,
      score: audits['largest-contentful-paint'].score,
      target: 2500, // 2.5초
    },
    cls: {
      value: audits['cumulative-layout-shift'].numericValue,
      displayValue: audits['cumulative-layout-shift'].displayValue,
      score: audits['cumulative-layout-shift'].score,
      target: 0.1,
    },
    fid: {
      // TBT를 FID 대체 지표로 사용
      value: audits['total-blocking-time'].numericValue,
      displayValue: audits['total-blocking-time'].displayValue,
      score: audits['total-blocking-time'].score,
      target: 100, // 100ms
    },
    
    // 추가 성능 지표
    fcp: {
      value: audits['first-contentful-paint'].numericValue,
      displayValue: audits['first-contentful-paint'].displayValue,
      score: audits['first-contentful-paint'].score,
      target: 1800, // 1.8초
    },
    si: {
      value: audits['speed-index'].numericValue,
      displayValue: audits['speed-index'].displayValue,
      score: audits['speed-index'].score,
      target: 3400, // 3.4초
    },
    tti: {
      value: audits['interactive'].numericValue,
      displayValue: audits['interactive'].displayValue,
      score: audits['interactive'].score,
      target: 3800, // 3.8초
    },
    
    // 전체 성능 점수
    performanceScore: lhr.categories.performance.score * 100,
  };
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  // LCP 개선 방안
  if (metrics.lcp.value > metrics.lcp.target) {
    const improvement = ((metrics.lcp.value - metrics.lcp.target) / 1000).toFixed(1);
    recommendations.push({
      category: 'LCP (Largest Contentful Paint)',
      current: metrics.lcp.displayValue,
      target: `< ${metrics.lcp.target / 1000}초`,
      impact: 'HIGH',
      suggestions: [
        '🖼️ 이미지 최적화: WebP 형식 사용, lazy loading 적용',
        '🚀 Server Components 활용: 초기 HTML에 중요 콘텐츠 포함',
        '📦 Code Splitting: dynamic import로 번들 크기 감소',
        '🔄 리소스 힌트: preload, prefetch 활용',
        '⚡ CDN 활용: 정적 자산의 로딩 시간 단축'
      ]
    });
  }
  
  // CLS 개선 방안
  if (metrics.cls.value > metrics.cls.target) {
    recommendations.push({
      category: 'CLS (Cumulative Layout Shift)',
      current: metrics.cls.displayValue,
      target: `< ${metrics.cls.target}`,
      impact: 'HIGH',
      suggestions: [
        '📐 이미지/동영상 크기 지정: width, height 속성 설정',
        '🔲 폰트 로딩 최적화: font-display: swap 사용',
        '📏 동적 콘텐츠 공간 확보: skeleton UI 활용',
        '🎨 애니메이션 최적화: transform, opacity만 사용',
        '📱 반응형 이미지: aspect-ratio CSS 활용'
      ]
    });
  }
  
  // TBT/FID 개선 방안
  if (metrics.fid.value > metrics.fid.target) {
    recommendations.push({
      category: 'TBT/FID (Total Blocking Time/First Input Delay)',
      current: metrics.fid.displayValue,
      target: `< ${metrics.fid.target}ms`,
      impact: 'HIGH',
      suggestions: [
        '🧠 JavaScript 최적화: 불필요한 re-render 방지',
        '⏰ 작업 분할: setTimeout, requestIdleCallback 활용',
        '🔄 Web Workers: 무거운 연산 백그라운드 처리',
        '📦 번들 최적화: tree shaking, dead code elimination',
        '⚡ React 최적화: React.memo, useMemo, useCallback 활용'
      ]
    });
  }
  
  // 전체 성능 점수 기반 권장사항
  if (metrics.performanceScore < 90) {
    recommendations.push({
      category: '전체 성능 최적화',
      current: `${metrics.performanceScore.toFixed(1)}점`,
      target: '90점 이상',
      impact: 'MEDIUM',
      suggestions: [
        '🏗️ Next.js 최적화: Image, Link 컴포넌트 활용',
        '🔄 캐싱 전략: SWR, React Query로 데이터 캐싱',
        '📊 성능 모니터링: @vercel/analytics, @vercel/speed-insights',
        '🎯 핵심 지표 추적: Core Web Vitals 지속 모니터링',
        '🔧 빌드 최적화: webpack bundle analyzer로 번들 분석'
      ]
    });
  }
  
  return recommendations;
}

function displayResults(metrics, recommendations) {
  console.log('\n🎯 Core Web Vitals 분석 결과');
  console.log('═'.repeat(50));
  
  // Core Web Vitals 표시
  console.log('\n📊 핵심 지표 (Core Web Vitals)');
  console.log('─'.repeat(30));
  
  displayMetric('LCP', metrics.lcp);
  displayMetric('CLS', metrics.cls);
  displayMetric('TBT', metrics.fid, 'FID 대체 지표');
  
  // 추가 성능 지표
  console.log('\n⚡ 추가 성능 지표');
  console.log('─'.repeat(30));
  
  displayMetric('FCP', metrics.fcp);
  displayMetric('SI', metrics.si);
  displayMetric('TTI', metrics.tti);
  
  // 전체 점수
  console.log(`\n🏆 전체 성능 점수: ${metrics.performanceScore.toFixed(1)}점`);
  
  // 개선 방안
  if (recommendations.length > 0) {
    console.log('\n💡 개선 방안');
    console.log('═'.repeat(50));
    
    recommendations.forEach((rec, index) => {
      console.log(`\n${index + 1}. ${rec.category}`);
      console.log(`   현재: ${rec.current} → 목표: ${rec.target}`);
      console.log(`   영향도: ${rec.impact}`);
      console.log('   권장사항:');
      rec.suggestions.forEach(suggestion => {
        console.log(`   • ${suggestion}`);
      });
    });
  } else {
    console.log('\n✅ 모든 Core Web Vitals 기준을 만족합니다!');
  }
}

function displayMetric(name, metric, note = '') {
  const isGood = metric.score >= 0.9;
  const isOk = metric.score >= 0.5;
  const status = isGood ? '✅' : isOk ? '⚠️' : '❌';
  const scorePercent = (metric.score * 100).toFixed(0);
  
  console.log(
    `${status} ${name}: ${metric.displayValue} (점수: ${scorePercent}점)${note ? ` - ${note}` : ''}`
  );
}

async function saveReport(lighthouseReport, metrics, recommendations) {
  const reportDir = path.join(process.cwd(), 'reports', 'performance');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // 디렉토리 생성
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  // Lighthouse 전체 보고서 저장
  const lighthouseFile = path.join(reportDir, `lighthouse-${timestamp}.json`);
  fs.writeFileSync(lighthouseFile, lighthouseReport);
  
  // 요약 보고서 저장
  const summaryReport = {
    timestamp: new Date().toISOString(),
    metrics,
    recommendations,
    summary: {
      coreWebVitalsPass: 
        metrics.lcp.score >= 0.9 && 
        metrics.cls.score >= 0.9 && 
        metrics.fid.score >= 0.9,
      performanceScore: metrics.performanceScore,
      criticalIssues: recommendations.filter(r => r.impact === 'HIGH').length,
    }
  };
  
  const summaryFile = path.join(reportDir, `performance-summary-${timestamp}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(summaryReport, null, 2));
  
  console.log(`\n📄 보고서 저장됨:`);
  console.log(`   • 전체 보고서: ${lighthouseFile}`);
  console.log(`   • 요약 보고서: ${summaryFile}`);
}

// 실행
if (require.main === module) {
  runLighthouseAnalysis().catch(console.error);
}

module.exports = { runLighthouseAnalysis };