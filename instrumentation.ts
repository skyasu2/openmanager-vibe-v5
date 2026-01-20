/**
 * Next.js Instrumentation
 *
 * 앱 시작 시 실행되는 초기화 코드
 * Sentry 서버 측 SDK 초기화 포함
 */

export async function register() {
  // 🎯 Sentry 서버 측 SDK 초기화
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Node.js 런타임에서 Sentry 서버 설정 로드
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge 런타임에서 Sentry Edge 설정 로드
    await import('./sentry.edge.config');
  }

  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      // 이 import는 Zod 스키마를 사용하여 환경 변수를 즉시 검증합니다.
      // 실패 시, 앱 시작이 중단됩니다.
      await import('./src/env');
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

    // 🎯 통합 설정 관리자 초기화 (비활성화 - 파일 존재하지 않음)
    // NOTE: config/index.js가 존재하지 않아 초기화 건너뜀
    // 필요시 src/lib/config 모듈 활용

    // 테스트 모드에서 브라우저 API polyfill 로드
    if (process.env.__NEXT_TEST_MODE === 'true') {
      try {
        require('./src/polyfills');
        console.log('🧪 테스트 모드: 브라우저 API polyfill 로드됨');
      } catch (error) {
        console.warn('⚠️ Polyfill 로드 실패:', error.message);
      }
    }
  }
}
