/**
 * 🚀 Next.js Instrumentation
 * 
 * 이 파일은 Next.js 앱이 시작될 때 자동으로 실행됩니다.
 * 암호화된 환경변수를 자동으로 로드합니다.
 */

export async function register() {
  // 서버 사이드에서만 실행
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Next.js 서버 초기화 중...');
    
    try {
      // 암호화된 환경변수 로더 import
      const { initializeEncryptedEnv } = await import('@/lib/environment/encrypted-env-loader');
      
      // 암호화된 환경변수 로드
      const loaded = await initializeEncryptedEnv();
      
      if (loaded) {
        console.log('✅ 암호화된 환경변수 로드 성공');
      } else {
        console.log('ℹ️ 암호화된 환경변수를 사용하지 않음 (일반 환경변수 사용)');
      }
    } catch (error) {
      console.error('❌ 환경변수 초기화 실패:', error);
    }
    
    // 환경 정보 로깅
    console.log('📊 환경 정보:', {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL ? 'true' : 'false',
      VERCEL_ENV: process.env.VERCEL_ENV || 'N/A',
      RUNTIME: process.env.NEXT_RUNTIME,
    });
  }
}