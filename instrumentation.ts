/**
 * Next.js Instrumentation
 * 
 * 앱 시작 시 실행되는 초기화 코드
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 테스트 모드에서 브라우저 API polyfill 로드
    if (process.env.__NEXT_TEST_MODE === 'true') {
      try {
        require('./src/test/polyfills.js');
        console.log('🧪 테스트 모드: 브라우저 API polyfill 로드됨');
      } catch (error) {
        console.warn('⚠️ Polyfill 로드 실패:', error.message);
      }
    }

    const { checkRequiredEnvVars } = await import('@/lib/validate-env');
    
    // 환경변수 검증
    try {
      checkRequiredEnvVars();
    } catch (error) {
      console.error('🚨 환경변수 검증 실패:', error);
      // 프로덕션에서는 앱 시작 중단
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}