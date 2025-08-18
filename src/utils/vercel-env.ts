/**
 * 🔧 베르셀 환경 감지 안정화 유틸리티
 * 
 * 문제: 기존 환경 감지가 매 렌더링마다 재계산되어 불안정
 * 해결: 1회만 실행되는 안정적인 환경 감지 로직
 * 
 * @created 2025-08-18
 * @issue 베르셀 5초 자동 새로고침 근본 해결
 */

/**
 * 베르셀 환경 여부를 안정적으로 감지
 * - 서버사이드: 환경변수만 체크
 * - 클라이언트사이드: hostname 체크
 * - 1회만 실행되어 성능 최적화
 */
export const isVercelEnvironment = (() => {
  // 서버사이드 렌더링 중인 경우
  if (typeof window === 'undefined') {
    return process.env.VERCEL === '1';
  }
  
  // 클라이언트사이드에서는 hostname으로 판단
  return window.location.hostname.includes('vercel.app') || 
         window.location.hostname.endsWith('.vercel.app');
})();

/**
 * 베르셀 환경별 설정값 제공
 */
export const vercelConfig = {
  // 타이머 지연 시간 (베르셀: 1초, 로컬: 0.1초)
  initDelay: isVercelEnvironment ? 1000 : 100,
  
  // 인증 재시도 간격 (베르셀: 10초, 로컬: 5초)
  authRetryDelay: isVercelEnvironment ? 10000 : 5000,
  
  // 시스템 동기화 debounce (베르셀: 3초, 로컬: 1초)
  syncDebounce: isVercelEnvironment ? 3000 : 1000,
  
  // 클라이언트 마운트 지연 (베르셀: 300ms, 로컬: 0ms)
  mountDelay: isVercelEnvironment ? 300 : 0,
  
  // 환경 표시 문자열
  envLabel: isVercelEnvironment ? 'Vercel' : 'Local'
};

/**
 * 디버그 로그에 환경 정보 추가
 */
export const debugWithEnv = (message: string) => {
  return `[${vercelConfig.envLabel}] ${message}`;
};

/**
 * 베르셀 환경에서만 실행되는 함수
 */
export const onlyInVercel = (fn: () => void) => {
  if (isVercelEnvironment) {
    fn();
  }
};

/**
 * 로컬 환경에서만 실행되는 함수
 */
export const onlyInLocal = (fn: () => void) => {
  if (!isVercelEnvironment) {
    fn();
  }
};

/**
 * 환경별 다른 값 반환
 */
export const envValue = <T>(vercelValue: T, localValue: T): T => {
  return isVercelEnvironment ? vercelValue : localValue;
};