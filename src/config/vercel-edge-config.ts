/**
 * 🚀 Vercel Edge Runtime 성능 최적화 설정
 * Pro/Hobby 플랜 대응 및 리소스 관리
 */

// Vercel 플랜별 제한사항 정의
export const VERCEL_PLANS = {
  hobby: {
    // 실행 시간 제한
    maxExecutionTime: 10000, // 10초
    maxMemory: 128, // MB

    // 요청 제한
    requestsPerMinute: 100,
    edgeRequestsPerMonth: 1000000, // 1M

    // 기능 제한 - 무료 플랜에서는 Google AI 완전 비활성화
    enableGoogleAI: false, // 무료 모델 전용 (Google AI 비활성화)
    enableAdvancedRAG: false,
    enableMCPIntegration: false,
    maxConcurrentRequests: 10,

    // 타임아웃 설정
    ragTimeout: 3000,
    koreanNLPTimeout: 2000,
    mcpTimeout: 1000,

    // 캐시 설정
    cacheSize: 50,
    cacheTTL: 300000, // 5분
  },

  pro: {
    // 실행 시간 제한
    maxExecutionTime: 15000, // 15초 (기본), 최대 300초 구성 가능
    maxMemory: 1024, // MB

    // 요청 제한
    requestsPerMinute: 1000,
    edgeRequestsPerMonth: 10000000, // 10M

    // 기능 활성화
    enableGoogleAI: true,
    enableAdvancedRAG: true,
    enableMCPIntegration: true,
    maxConcurrentRequests: 100,

    // 타임아웃 설정
    ragTimeout: 10000,
    koreanNLPTimeout: 8000,
    mcpTimeout: 5000,

    // 캐시 설정
    cacheSize: 200,
    cacheTTL: 600000, // 10분
  },
} as const;

// Edge Runtime 지역 설정
export const EDGE_REGIONS = {
  asia: ['icn1', 'hnd1', 'sin1'], // Seoul, Tokyo, Singapore
  global: ['iad1', 'fra1', 'syd1'], // Washington DC, Frankfurt, Sydney
  americas: ['iad1', 'sfo1', 'cle1'], // East Coast, West Coast, Cleveland
} as const;

// 현재 환경 감지
export function detectVercelEnvironment() {
  const isVercel = process.env.VERCEL === '1';
  const isPro = process.env.VERCEL_PLAN === 'pro';
  const region = process.env.VERCEL_REGION || 'auto';
  const isDevelopment = process.env.NODE_ENV === 'development';

  return {
    isVercel,
    isPro: isPro || isDevelopment, // 개발 환경에서는 Pro 기능 활성화
    isHobby: !isPro && !isDevelopment,
    region,
    isDevelopment,
    environment: process.env.NODE_ENV || 'production',
  };
}

// 플랜별 설정 가져오기
export function getVercelConfig() {
  const env = detectVercelEnvironment();
  const config = env.isPro ? VERCEL_PLANS.pro : VERCEL_PLANS.hobby;

  return {
    ...config,
    environment: env,
    regions: EDGE_REGIONS.asia, // 아시아 지역 최적화
  };
}
