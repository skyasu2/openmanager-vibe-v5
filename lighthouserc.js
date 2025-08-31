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

    // 🏆 성능 예산 (현실적 기준으로 조정)
    assert: {
      assertions: {
        // 🎯 Core Web Vitals (현실적 목표)
        'categories:performance': ['warn', { minScore: 0.75 }], // 75점 이상 (현재 수준 유지)
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }], // 2.0초 이하 (완화)
        'largest-contentful-paint': ['warn', { maxNumericValue: 3000 }], // 3.0초 이하 (완화)
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }], // 0.15 이하 (약간 완화)

        // 📊 성능 메트릭 (현실적 조정)
        'speed-index': ['warn', { maxNumericValue: 4000 }], // 4.0초 이하
        'interactive': ['warn', { maxNumericValue: 4500 }], // 4.5초 이하  
        'total-blocking-time': ['warn', { maxNumericValue: 500 }], // 500ms 이하 (완화)
        'max-potential-fid': ['warn', { minScore: 0.3 }], // FID 대체 지표

        // 🔧 리소스 최적화
        'unused-javascript': ['warn', { maxLength: 5 }], // 5개 이하
        'unused-css-rules': ['warn', { maxLength: 2 }], // 2개 이하
        'uses-long-cache-ttl': ['warn', { maxLength: 10 }], // 10개 이하

        // 🔐 보안 (현실적 목표)
        'csp-xss': ['warn', { minScore: 0.1 }], // CSP 기본 설정 목표

        // 📱 사용성
        'bf-cache': ['warn', { minScore: 0.1 }], // Back/Forward 캐시 개선
        'redirects': ['warn', { minScore: 0.6 }], // 리다이렉트 최적화
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