/**
 * 🚀 성능 최적화 설정
 * Core Web Vitals 개선을 위한 중앙 설정
 */

// LCP 최적화를 위한 중요 리소스 우선순위
export const CRITICAL_RESOURCES = {
  // 폰트 프리로드 (LCP 개선)
  fonts: [
    {
      href: '/fonts/inter-var.woff2',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
  ],

  // 중요 CSS (Above-the-fold)
  criticalCSS: ['base', 'components', 'utilities'],

  // 즉시 로드해야 할 컴포넌트
  immediateComponents: [
    'UnifiedProfileHeader',
    'FeatureCardsGrid',
    'SystemBootstrap',
  ],
};

// 지연 로드할 컴포넌트 목록
export const LAZY_LOAD_COMPONENTS = {
  // 3초 후 로드
  deferred: [
    'AIAssistantAdminDashboard',
    'PerformanceDashboard',
    'LogAnalyticsDashboard',
  ],

  // 사용자 상호작용 시 로드
  onDemand: ['FeatureCardModal', 'GCPQuotaMonitoringDashboard', 'AdminPanel'],

  // 뷰포트 진입 시 로드
  viewport: ['Chart', 'MonacoEditor', 'Mermaid'],
};

// 번들 분할 설정
export const BUNDLE_OPTIMIZATION = {
  // vendor 라이브러리 분할 (1.1MB → 250KB씩 분할)
  vendorChunks: {
    react: ['react', 'react-dom'],
    ui: ['@radix-ui', 'lucide-react'],
    charts: ['recharts', 'react-chartjs-2'],
    utils: ['date-fns', 'lodash', 'axios'],
    ai: ['@ai-sdk/mistral', '@supabase/supabase-js'],
  },

  // 라우트별 코드 분할
  routeChunks: {
    '/': 'home',
    '/main': 'main',
    '/dashboard': 'dashboard',
  },
};

// CLS 방지를 위한 컴포넌트 크기 사전 정의
export const LAYOUT_STABILITY = {
  skeletonSizes: {
    featureCard: { width: '300px', height: '200px' },
    chart: { width: '100%', height: '400px' },
    profileHeader: { width: '200px', height: '40px' },
  },

  // 애니메이션 성능 최적화
  animations: {
    reduceMotion: false, // 사용자 설정에 따라 동적 조정
    maxConcurrent: 3, // 동시 실행 애니메이션 제한
    priority: ['page-transition', 'user-interaction', 'decorative'],
  },
};

// FID 최적화를 위한 메인 스레드 관리
export const MAIN_THREAD_OPTIMIZATION = {
  // 작업 분할 크기
  chunkSize: 5, // 5ms 단위로 작업 분할

  // 우선순위별 작업 큐
  taskPriority: {
    critical: ['user-input', 'navigation'],
    high: ['data-fetch', 'state-update'],
    normal: ['animation', 'analytics'],
    low: ['prefetch', 'cleanup'],
  },

  // 지연 실행할 작업들
  deferredTasks: [
    'analytics-tracking',
    'performance-monitoring',
    'error-reporting',
  ],
};

// 리소스 힌트 설정
export const RESOURCE_HINTS = {
  preconnect: ['https://fonts.googleapis.com', 'https://api.openmanager.dev'],

  prefetch: ['/api/servers', '/api/system'],

  preload: ['/fonts/inter-var.woff2', '/images/hero-bg.webp'],
};

// 성능 모니터링 임계값
export const PERFORMANCE_THRESHOLDS = {
  lcp: 2500, // 2.5초
  fid: 100, // 100ms
  cls: 0.1, // 0.1
  fcp: 1800, // 1.8초
  ttfb: 600, // 600ms
};
