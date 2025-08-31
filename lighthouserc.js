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
    // 📊 수집 설정 - CI/CD 환경 대응
    collect: {
      numberOfRuns: 3,
      url: [
        'https://openmanager-vibe-v5.vercel.app/login',  // 로그인 페이지 (진입점)
        'https://openmanager-vibe-v5.vercel.app/main',   // 메인 페이지 (시스템 제어)
      ],
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage --disable-gpu --disable-web-security',
        preset: 'desktop',
        // 📈 성능 최적화 검증을 위한 설정
        skipAudits: [
          'uses-http2',              // Vercel 자동 처리
          'notification-on-start',   // 알림 권한 요청 없음
          'installable-manifest',    // PWA 아님
          'splash-screen',           // PWA 아님
          'themed-omnibox',          // PWA 아님
          'maskable-icon',           // PWA 아님
          'service-worker',          // PWA 아님
        ],
        // 🔧 전체 카테고리 수집으로 변경 (assertion과 일치)
        onlyCategories: ['performance', 'best-practices', 'accessibility', 'seo'],
      },
    },

    // 🏆 성능 예산 (핵심 메트릭 집중)
    assert: {
      assertions: {
        // 🎯 Core Web Vitals (실제 중요 메트릭)
        'categories:performance': ['warn', { minScore: 0.75 }], // 75점 이상
        'categories:accessibility': ['warn', { minScore: 0.9 }], // 접근성 90점 이상
        'categories:best-practices': ['warn', { minScore: 0.9 }], // 모범 사례 90점 이상
        
        // 📈 핵심 성능 지표
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2.0초 이하
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // 3.0초 이하
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }], // 0.15 이하
        'total-blocking-time': ['warn', { maxNumericValue: 500 }], // 500ms 이하

        // 🎨 접근성 (색상 대비 중요)
        'color-contrast': ['error', { minScore: 0.9 }], // 색상 대비 90점 이상

        // 🔐 보안 헤더
        'csp-xss': ['warn', { minScore: 0.3 }], // CSP 기본 설정 향상

        // 🔄 캐시 최적화
        'bf-cache': ['warn', { minScore: 0.3 }], // Back/Forward 캐시 개선
        'uses-long-cache-ttl': ['warn', { maxLength: 8 }], // 8개 이하로 완화
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