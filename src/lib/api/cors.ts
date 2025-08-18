/**
 * CORS 헤더 설정
 * API 라우트에서 사용하는 공통 CORS 헤더
 */

// 개발/프로덕션 환경별 도메인 설정
const getAllowedOrigin = () => {
  if (process.env.NODE_ENV === 'development') {
    return 'http://localhost:3000';
  }
  // Vercel 프로덕션 도메인
  return process.env.NEXT_PUBLIC_APP_URL || 'https://openmanager-vibe-v5.vercel.app';
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': getAllowedOrigin(),
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * 더 엄격한 CORS 설정이 필요한 경우 사용
 */
export const strictCorsHeaders = {
  'Access-Control-Allow-Origin':
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

/**
 * OPTIONS 요청을 처리하는 헬퍼 함수
 */
export function handleOptionsRequest() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
