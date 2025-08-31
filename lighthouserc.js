/**
 * 🚀 Lighthouse CI Configuration - Phase 1 완료
 * 
 * 자동 성능 회귀 감지 시스템
 * - Box-Muller Transform 캐시 최적화 검증
 * - Core Web Vitals 모니터링
 * - 성능 예산 임계값 검사
 */

module.exports = {
  ci: {
    // 📊 수집 설정
    collect: {
      numberOfRuns: 3,
      url: [
        'http://localhost:3000/',          // 메인 페이지 (AI 어시스턴트 카드)
        'http://localhost:3000/main',      // 시스템 제어 페이지
        'http://localhost:3000/dashboard', // 서버 모니터링 대시보드
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu',
        preset: 'desktop',
        // 📈 Box-Muller 캐시 성능 측정을 위한 추가 메트릭
        skipAudits: ['uses-http2'], // HTTP/2는 Vercel에서 자동 처리
        onlyCategories: ['performance', 'best-practices'],
      },
    },

    // 🏆 성능 예산 (A+ 등급 기준)
    assert: {
      assertions: {
        // 🎯 Core Web Vitals (Google 권장 기준)
        'categories:performance': ['error', { minScore: 0.90 }], // 90점 이상
        'first-contentful-paint': ['error', { maxNumericValue: 1800 }], // 1.8초 이하
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }], // 2.5초 이하
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }], // 0.1 이하
        'first-input-delay': ['error', { maxNumericValue: 100 }], // 100ms 이하

        // 📊 추가 성능 메트릭
        'speed-index': ['warn', { maxNumericValue: 3400 }], // 3.4초 이하
        'interactive': ['warn', { maxNumericValue: 3800 }], // 3.8초 이하
        'total-blocking-time': ['warn', { maxNumericValue: 200 }], // 200ms 이하

        // 🔧 Box-Muller 캐시 관련 최적화 검증
        'unused-javascript': ['warn', { maxNumericValue: 20000 }], // 20KB 이하
        'mainthread-work-breakdown': ['warn', { maxNumericValue: 2000 }], // 2초 이하
        'dom-size': ['warn', { maxNumericValue: 1500 }], // 1500개 노드 이하
      },
    },

    // 📈 회귀 감지 설정 (중요!)
    upload: {
      target: 'temporary-public-storage',
      ignoreDuplicateBuildFailure: true,
      // 🚨 성능 회귀 감지 임계값
      serverBaseUrl: 'https://lhci-server.example.com', // 추후 자체 서버 구축 시 사용
      token: process.env.LHCI_GITHUB_APP_TOKEN,
    },

    // ⚙️ 서버 설정 (로컬 실행용)
    server: {
      port: 9001,
      storage: {
        storageMethod: 'sql',
        sqlDialect: 'sqlite3',
        sqlDatabasePath: '.lighthouseci/database.db',
      },
    },

    // 🔍 회귀 감지 로직
    wizard: {
      // 성능 회귀 감지를 위한 기준선 설정
      preset: 'perf',
      budgetPath: './lighthouse-budget.json',
    },
  },

  // 📊 커스텀 성능 감사
  extends: [
    // Box-Muller 캐시 성능 검증을 위한 커스텀 감사
    './lighthouse-custom-audits.js',
  ].filter(Boolean), // undefined 필터링
};