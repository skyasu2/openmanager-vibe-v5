'use client';

import { useEffect, useState } from 'react';

/**
 * CSRF 토큰 자동 발급 컴포넌트
 *
 * 페이지 로드 시 /api/csrf-token을 호출하여 CSRF 토큰을 받아옵니다.
 * 토큰은 쿠키로 저장되며, 이후 API 요청 시 자동으로 사용됩니다.
 */
export function CSRFTokenProvider({ children }: { children: React.ReactNode }) {
  const [_isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 페이지 로드 시 CSRF 토큰 발급 요청
    const fetchCSRFToken = async () => {
      try {
        const response = await fetch('/api/csrf-token');
        if (response.ok) {
          console.log('✅ [CSRF] 토큰 발급 완료');
          setIsReady(true);
        } else {
          console.error('❌ [CSRF] 토큰 발급 실패:', response.status);
          setIsReady(true); // 실패해도 페이지는 표시
        }
      } catch (error) {
        console.error('❌ [CSRF] 토큰 발급 오류:', error);
        setIsReady(true); // 오류가 있어도 페이지는 표시
      }
    };

    void fetchCSRFToken();
  }, []);

  // 토큰 발급 완료 전에도 children 렌더링 (UX 개선)
  return <>{children}</>;
}
