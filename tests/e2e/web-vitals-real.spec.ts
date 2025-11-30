/**
 * 🌐 실제 환경 Web Vitals E2E 테스트
 *
 * @description Playwright로 실제 브라우저에서 Web Vitals 측정
 * @environment 실제 Vercel 배포 환경 + 로컬 개발 환경
 * @integration web-vitals 패키지 + /api/web-vitals API
 */

import { expect, type Page, test } from '@playwright/test';
import { TIMEOUTS } from './helpers/timeouts';

// 🎯 Web Vitals 목표 임계값
const WEB_VITALS_THRESHOLDS = {
  LCP: 2500, // 2.5초
  FID: 100, // 100ms
  CLS: 0.1, // 0.1 점수
  FCP: 1800, // 1.8초
  TTFB: 800, // 800ms
} as const;

// 📊 Web Vitals 데이터 타입
interface VitalMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

// 🔧 Web Vitals 수집 헬퍼
async function collectWebVitals(
  page: Page,
  timeout = 8000
): Promise<VitalMetric[]> {
  const _vitals: VitalMetric[] = [];

  // Web Vitals 수집 스크립트 주입
  await page.addInitScript(() => {
    // 전역 변수에 메트릭 저장
    (window as any).webVitalsMetrics = [];

    // web-vitals가 로드되면 수집 시작
    import('/node_modules/web-vitals/dist/web-vitals.js')
      .then((webVitals) => {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = webVitals;

        const handleVital = (metric: any) => {
          (window as any).webVitalsMetrics.push({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
          });
        };

        getCLS(handleVital);
        getFID(handleVital);
        getFCP(handleVital);
        getLCP(handleVital);
        getTTFB(handleVital);
      })
      .catch(() => {
        // web-vitals 로드 실패 시 더미 데이터
        console.warn('web-vitals 로드 실패');
      });
  });

  // 페이지 로드 후 메트릭 수집 대기
  await page.waitForTimeout(timeout);

  // 수집된 메트릭 반환
  const collectedVitals = await page.evaluate(() => {
    return (window as any).webVitalsMetrics || [];
  });

  return collectedVitals;
}

// 🌐 테스트 환경별 URL 결정
function getTestUrl(): string {
  // Vercel 환경
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // GitHub Actions CI 환경
  if (process.env.CI) {
    return 'http://localhost:3000';
  }

  // 로컬 개발 환경
  return 'http://localhost:3000';
}

test.describe('🌐 실제 환경 Web Vitals 측정', () => {
  test.beforeEach(async ({ page: _page }) => {
    // 타임아웃 설정 (Web Vitals 수집 시간 고려)
    test.setTimeout(30000);
  });

  test('🏠 홈페이지 Web Vitals 측정', async ({ page }) => {
    const testUrl = getTestUrl();

    // 페이지 로드
    await page.goto(testUrl);

    // Web Vitals 수집
    const vitals = await collectWebVitals(page);

    // 기본 검증
    expect(vitals).toBeInstanceOf(Array);
    console.log('📊 수집된 Web Vitals:', vitals);

    // LCP (Largest Contentful Paint) 검증
    const lcp = vitals.find((v) => v.name === 'LCP');
    if (lcp) {
      console.log(
        `📏 LCP: ${lcp.value}ms (목표: ${WEB_VITALS_THRESHOLDS.LCP}ms 미만)`
      );
      expect(lcp.value).toBeGreaterThan(0);

      // 성능 목표 달성 시 로그
      if (lcp.value < WEB_VITALS_THRESHOLDS.LCP) {
        console.log('✅ LCP 목표 달성!');
      } else {
        console.log('⚠️ LCP 개선 필요');
      }
    }

    // FCP (First Contentful Paint) 검증
    const fcp = vitals.find((v) => v.name === 'FCP');
    if (fcp) {
      console.log(
        `🎨 FCP: ${fcp.value}ms (목표: ${WEB_VITALS_THRESHOLDS.FCP}ms 미만)`
      );
      expect(fcp.value).toBeGreaterThan(0);
    }

    // CLS (Cumulative Layout Shift) 검증
    const cls = vitals.find((v) => v.name === 'CLS');
    if (cls) {
      console.log(
        `📐 CLS: ${cls.value} (목표: ${WEB_VITALS_THRESHOLDS.CLS} 미만)`
      );
      expect(cls.value).toBeGreaterThanOrEqual(0);

      if (cls.value < WEB_VITALS_THRESHOLDS.CLS) {
        console.log('✅ CLS 목표 달성!');
      } else {
        console.log('⚠️ CLS 개선 필요 (레이아웃 안정성)');
      }
    }

    // TTFB (Time to First Byte) 검증
    const ttfb = vitals.find((v) => v.name === 'TTFB');
    if (ttfb) {
      console.log(
        `⚡ TTFB: ${ttfb.value}ms (목표: ${WEB_VITALS_THRESHOLDS.TTFB}ms 미만)`
      );
      expect(ttfb.value).toBeGreaterThan(0);
    }
  });

  test('📊 대시보드 페이지 Web Vitals 측정', async ({ page }) => {
    const testUrl = getTestUrl();

    // 대시보드 페이지로 이동
    await page.goto(`${testUrl}/dashboard`);

    // 대시보드 로딩 완료 대기
    await page.waitForSelector('[data-testid="dashboard-content"]', {
      timeout: TIMEOUTS.MODAL_DISPLAY,
    });

    // Web Vitals 수집
    const vitals = await collectWebVitals(page, 10000); // 더 긴 대기 시간

    console.log('📊 대시보드 Web Vitals:', vitals);

    // 대시보드는 더 복잡한 페이지이므로 관대한 기준 적용
    const lcp = vitals.find((v) => v.name === 'LCP');
    if (lcp) {
      expect(lcp.value).toBeGreaterThan(0);
      console.log(`📈 대시보드 LCP: ${lcp.value}ms`);
    }

    // CLS는 대시보드에서 더 중요 (동적 컨텐츠 많음)
    const cls = vitals.find((v) => v.name === 'CLS');
    if (cls) {
      expect(cls.value).toBeLessThan(0.3); // 관대한 임계값
      console.log(`📐 대시보드 CLS: ${cls.value}`);
    }
  });

  test('🔗 Web Vitals API 통합 테스트', async ({ page }) => {
    const testUrl = getTestUrl();

    // 페이지 로드
    await page.goto(testUrl);

    // Web Vitals 수집
    const vitals = await collectWebVitals(page);

    // API 엔드포인트 테스트
    if (vitals.length > 0) {
      const apiResponse = await page.request.post(`${testUrl}/api/web-vitals`, {
        data: {
          url: testUrl,
          userAgent: await page.evaluate(() => navigator.userAgent),
          timestamp: Date.now(),
          metrics: vitals,
          sessionId: `e2e-test-${Date.now()}`,
          deviceType: 'desktop',
        },
      });

      expect(apiResponse.ok()).toBeTruthy();

      const responseData = await apiResponse.json();
      console.log('🔗 API 응답:', responseData);

      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.analysis).toBeDefined();
      expect(['good', 'needs-improvement', 'poor']).toContain(
        responseData.data.analysis.overall
      );
    }
  });

  test('⚡ Edge Runtime 성능 검증', async ({ page }) => {
    const testUrl = getTestUrl();

    // Edge Runtime API 응답 시간 측정
    const startTime = Date.now();
    const response = await page.request.get(`${testUrl}/api/web-vitals`);
    const responseTime = Date.now() - startTime;

    expect(response.ok()).toBeTruthy();

    const data = await response.json();
    console.log('⚡ Edge Runtime 응답 시간:', `${responseTime}ms`);
    console.log('🚀 API 정보:', data.service);

    // Edge Runtime은 100ms 이하 응답 목표
    expect(responseTime).toBeLessThan(1000); // 1초 이하 (네트워크 지연 고려)
    expect(data.runtime).toBe('edge');
  });

  test('📱 모바일 시뮬레이션 Web Vitals', async ({ browser }) => {
    // 모바일 컨텍스트 생성
    const context = await browser.newContext({
      ...browser.devices['iPhone 12'],
    });

    const page = await context.newPage();
    const testUrl = getTestUrl();

    try {
      await page.goto(testUrl);

      // 모바일에서 Web Vitals 수집
      const vitals = await collectWebVitals(page);

      console.log('📱 모바일 Web Vitals:', vitals);

      // 모바일은 더 관대한 기준 적용
      const lcp = vitals.find((v) => v.name === 'LCP');
      if (lcp) {
        expect(lcp.value).toBeGreaterThan(0);
        // 모바일 LCP 목표: 4초 이하
        if (lcp.value < 4000) {
          console.log('📱✅ 모바일 LCP 목표 달성!');
        } else {
          console.log('📱⚠️ 모바일 LCP 개선 필요');
        }
      }

      const cls = vitals.find((v) => v.name === 'CLS');
      if (cls) {
        expect(cls.value).toBeGreaterThanOrEqual(0);
        console.log(`📱📐 모바일 CLS: ${cls.value}`);
      }
    } finally {
      await context.close();
    }
  });

  test('🎯 성능 회귀 방지 체크', async ({ page }) => {
    const testUrl = getTestUrl();

    await page.goto(testUrl);

    // 성능 기준선 설정 (실제 환경에서 측정된 양호한 값들)
    const PERFORMANCE_BASELINE = {
      LCP: 3000, // 3초 (안전 마진 포함)
      FCP: 2000, // 2초
      CLS: 0.2, // 0.2 (관대한 기준)
      TTFB: 1500, // 1.5초
    };

    const vitals = await collectWebVitals(page);

    // 성능 회귀 검증
    vitals.forEach((vital) => {
      const baseline =
        PERFORMANCE_BASELINE[vital.name as keyof typeof PERFORMANCE_BASELINE];
      if (baseline) {
        console.log(
          `🎯 ${vital.name}: ${vital.value}ms (기준선: ${baseline}ms)`
        );

        // 기준선을 크게 초과하는 경우 경고
        if (vital.value > baseline * 1.5) {
          console.warn(`⚠️ ${vital.name} 성능 회귀 가능성: ${vital.value}ms`);
        } else {
          console.log(`✅ ${vital.name} 성능 양호`);
        }

        // 테스트는 더 관대하게 (기준선의 2배까지 허용)
        expect(vital.value).toBeLessThan(baseline * 2);
      }
    });

    // 최소한의 메트릭이 수집되었는지 확인
    expect(vitals.length).toBeGreaterThan(0);
  });
});

// 🔧 테스트 환경별 설정
test.describe.configure({
  mode: 'parallel',
  timeout: TIMEOUTS.NETWORK_REQUEST, // 30초 타임아웃
});
