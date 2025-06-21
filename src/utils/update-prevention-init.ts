/**
 * 🛡️ 과도한 갱신 방지 시스템 초기화
 *
 * 애플리케이션 시작 시 자동으로 갱신 방지 시스템을 활성화합니다.
 */

import { initializeUpdatePrevention } from './update-prevention';

// 클라이언트 사이드에서만 실행
if (typeof window !== 'undefined') {
  // DOM이 로드된 후 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeUpdatePrevention();
    });
  } else {
    // 이미 로드된 경우 즉시 초기화
    initializeUpdatePrevention();
  }
}

export {}; // 모듈로 처리하기 위한 export
