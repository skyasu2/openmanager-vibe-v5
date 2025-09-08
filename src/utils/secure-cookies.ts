/**
 * 🔐 보안 쿠키 유틸리티 - Vercel 환경 최적화
 * 
 * AI 교차검증 기반 보안 강화:
 * - HttpOnly는 클라이언트에서 설정 불가하므로 제외
 * - Secure 플래그는 HTTPS 환경에서만 적용
 * - SameSite=Strict로 CSRF 공격 방지
 */

/**
 * Vercel 환경 감지
 */
export function isVercelEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.hostname.includes('vercel.app') ||
           window.location.hostname.includes('.vercel.app');
  }
  return process.env.VERCEL === '1' || !!process.env.VERCEL_ENV;
}

/**
 * HTTPS 환경 감지
 */
export function isSecureEnvironment(): boolean {
  if (typeof window !== 'undefined') {
    return window.location.protocol === 'https:';
  }
  return process.env.NODE_ENV === 'production';
}

/**
 * 보안 쿠키 설정 생성
 */
export function getSecureCookieOptions(maxAge?: number): string {
  const options = ['path=/'];
  
  if (maxAge) {
    options.push(`max-age=${maxAge}`);
  }
  
  // 🔒 보안 플래그들
  if (isSecureEnvironment()) {
    options.push('Secure'); // HTTPS에서만
  }
  
  // 🛡️ CSRF 방지 - 가장 엄격한 설정
  options.push('SameSite=Strict');
  
  return options.join('; ');
}

/**
 * 보안 쿠키 설정
 */
export function setSecureCookie(name: string, value: string, maxAge?: number): void {
  if (typeof document === 'undefined') return;
  
  const cookieString = `${name}=${value}; ${getSecureCookieOptions(maxAge)}`;
  document.cookie = cookieString;
  
  console.log(`🍪 보안 쿠키 설정: ${name}`, {
    secure: isSecureEnvironment(),
    sameSite: 'Strict',
    environment: isVercelEnvironment() ? 'Vercel' : 'Local'
  });
}

/**
 * 보안 쿠키 삭제
 */
export function deleteSecureCookie(name: string): void {
  if (typeof document === 'undefined') return;
  
  const expireOptions = getSecureCookieOptions().replace('max-age=', 'expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; ');
  document.cookie = `${name}=; ${expireOptions}`;
  
  console.log(`🗑️ 보안 쿠키 삭제: ${name}`);
}

/**
 * OAuth 리다이렉트 URL 검증
 */
export function validateRedirectUrl(url: string): boolean {
  const allowedDomains = [
    'openmanager-vibe-v5.vercel.app',
    'localhost:3000',
    'localhost:3001', // 개발용 포트들
  ];
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // 🔧 Vercel 패턴 매칭 개선
    const isVercelDeploy = 
      hostname === 'openmanager-vibe-v5.vercel.app' || // 프로덕션
      hostname.startsWith('openmanager-vibe-v5-') && hostname.endsWith('.vercel.app') || // 프리뷰 배포
      hostname.includes('-skyasus-projects.vercel.app'); // 사용자별 배포
    
    const isLocalDev = hostname === 'localhost' && (urlObj.port === '3000' || urlObj.port === '3001');
    
    const isAllowed = isVercelDeploy || isLocalDev;
    
    // 🔧 프로덕션에서만 로그 출력하도록 조건부 로깅
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔍 OAuth URL 검증: ${url}`, {
        hostname,
        port: urlObj.port,
        isVercelDeploy,
        isLocalDev,
        isAllowed
      });
    }
    
    return isAllowed;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ URL 검증 실패:', error);
    }
    return false;
  }
}

/**
 * 게스트 세션용 보안 쿠키 관리 (AuthStateManager 키 체계 일치)
 */
export const guestSessionCookies = {
  /**
   * 게스트 세션 ID 설정 (guest_ 접두사 적용)
   */
  setGuestSession(sessionId: string): void {
    setSecureCookie('guest_session_id', sessionId, 24 * 60 * 60); // 24시간
    setSecureCookie('guest_auth_type', 'guest', 24 * 60 * 60); // guest_ 접두사 추가
    
    // 레거시 호환성을 위한 기존 키도 유지
    setSecureCookie('auth_type', 'guest', 24 * 60 * 60);
  },
  
  /**
   * 게스트 세션 삭제 (모든 관련 쿠키 정리)
   */
  clearGuestSession(): void {
    // 새 키 체계
    deleteSecureCookie('guest_session_id');
    deleteSecureCookie('guest_auth_type');
    
    // 레거시 호환성
    deleteSecureCookie('auth_type');
    deleteSecureCookie('session_id'); // 혹시 있을 수 있는 레거시 키
  },
  
  /**
   * 게스트 세션 확인 (새 키 체계 우선, 레거시 fallback)
   */
  hasGuestSession(): boolean {
    if (typeof document === 'undefined') return false;
    
    const cookies = document.cookie.split(';').map(c => c.trim());
    
    // 새 키 체계 우선 확인
    const hasNewSessionId = cookies.some(c => c.startsWith('guest_session_id='));
    const hasNewAuthType = cookies.some(c => c.startsWith('guest_auth_type=guest'));
    
    if (hasNewSessionId && hasNewAuthType) {
      return true;
    }
    
    // 레거시 키 체계 fallback
    const hasLegacySessionId = cookies.some(c => c.startsWith('guest_session_id='));
    const hasLegacyAuthType = cookies.some(c => c.startsWith('auth_type=guest'));
    
    return hasLegacySessionId && hasLegacyAuthType;
  }
};