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
 * 베르셀 환경 여부를 안전하게 감지하는 함수
 * - 런타임에 호출되어 안전함
 */
function getIsVercelEnvironment(): boolean {
  // 서버사이드 렌더링 중인 경우
  if (typeof window === 'undefined') {
    return process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  }
  
  // 클라이언트사이드에서는 hostname으로 판단
  try {
    return window.location.hostname.includes('vercel.app') || 
           window.location.hostname.endsWith('.vercel.app');
  } catch {
    return false; // window.location 접근 실패시 안전한 기본값
  }
}

/**
 * 베르셀 환경별 설정값 제공 (런타임에 계산)
 */
export const vercelConfig = {
  get isVercel() { return getIsVercelEnvironment(); },
  
  // 타이머 지연 시간 (베르셀: 300ms, 로컬: 100ms) - 무한 로딩 방지를 위해 단축
  get initDelay() { return this.isVercel ? 300 : 100; },
  
  // 인증 재시도 간격 (베르셀: 5초, 로컬: 3초) - 더 빠른 응답
  get authRetryDelay() { return this.isVercel ? 5000 : 3000; },
  
  // 시스템 동기화 debounce (베르셀: 1초, 로컬: 500ms) - 더 빠른 응답
  get syncDebounce() { return this.isVercel ? 1000 : 500; },
  
  // 클라이언트 마운트 지연 (베르셀: 100ms, 로컬: 0ms) - 빠른 시작
  get mountDelay() { return this.isVercel ? 100 : 0; },
  
  // 환경 표시 문자열
  get envLabel() { return this.isVercel ? 'Vercel' : 'Local'; }
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