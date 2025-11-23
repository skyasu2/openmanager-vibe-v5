/**
 * 🔧 시스템 공통 상수 정의
 *
 * 시스템 전반에서 사용되는 공통 상수를 중앙에서 관리
 */

// 🕐 시스템 자동 종료 시간 (30분)
export const SYSTEM_AUTO_SHUTDOWN_TIME = 30 * 60 * 1000; // 30분

// 🔄 시스템 상태 갱신 주기
export const SYSTEM_STATUS_UPDATE_INTERVAL = 30 * 1000; // 30초

// 🏃 헬스체크 주기
export const HEALTH_CHECK_INTERVAL =
  process.env.NODE_ENV === 'development'
    ? 60 * 1000 // 개발: 60초
    : 30 * 1000; // 운영: 30초

// 🔒 관리자 모드 설정
export const ADMIN_PASSWORD = (() => {
  const password = process.env.ADMIN_PASSWORD;

  // Production 환경에서는 환경변수 필수
  if (process.env.NODE_ENV === 'production' && !password) {
    throw new Error('❌ ADMIN_PASSWORD must be set in production environment');
  }

  // Development/Test 환경에서는 기본값 허용 (보안 경고 출력)
  if (!password) {
    console.warn(
      '⚠️  ADMIN_PASSWORD not set - using default (development only)'
    );
    return '4231';
  }

  return password;
})();

export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION = 10 * 1000; // 10초

// 📊 데이터 갱신 설정
export const AUTO_REFRESH_INTERVAL = {
  MIN: 30 * 1000, // 최소 30초
  MAX: 60 * 1000, // 최대 60초
  DEFAULT: 45 * 1000, // 기본 45초
};

// 🎯 시스템 제한 설정
export const SYSTEM_LIMITS = {
  MAX_SERVERS: 30,
  MAX_CONCURRENT_REQUESTS: 10,
  CACHE_TTL: 5 * 60 * 1000, // 5분
};
