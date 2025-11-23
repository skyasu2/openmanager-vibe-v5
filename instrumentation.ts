/**
 * Next.js Instrumentation
 *
 * 앱 시작 시 실행되는 초기화 코드
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // 이 import는 Zod 스키마를 사용하여 환경 변수를 즉시 검증합니다.
      // 실패 시, 앱 시작이 중단됩니다.
      await import('./src/env.js');
      console.log('✅ 통합 환경변수 검증 완료');
    } catch (error) {
      console.error(
        '🚨 치명적 오류: 환경변수 설정이 올바르지 않습니다.',
        error
      );
      // 프로덕션에서는 프로세스를 종료하여 배포 실패를 유도
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }

    // 🔐 선택적 환경 변수 검증 (TEST_API_KEY 등)
    try {
      const { validateEnvironmentVariables } = await import(
        './src/lib/config/env-validation'
      );
      validateEnvironmentVariables();
    } catch (error) {
      console.error('🚨 선택적 환경변수 검증 실패:', error);
      // 프로덕션에서는 프로세스를 종료하여 배포 실패를 유도
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }

    // 🎯 통합 설정 관리자 초기화 (사이드 이펙트 최적화)
    try {
      const { initializeConfig } = await import('./config/index.js');
      await initializeConfig();
      console.log('🚀 통합 설정 관리자 초기화 완료');
    } catch (error) {
      console.error('❌ 통합 설정 관리자 초기화 실패:', error.message);
    }

    // 테스트 모드에서 브라우저 API polyfill 로드
    if (process.env.__NEXT_TEST_MODE === 'true') {
      try {
        require('./src/test/polyfills.js');
        console.log('🧪 테스트 모드: 브라우저 API polyfill 로드됨');
      } catch (error) {
        console.warn('⚠️ Polyfill 로드 실패:', error.message);
      }
    }
  }
}
