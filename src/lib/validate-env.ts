/**
 * 🔐 간단한 환경변수 검증
 *
 * 앱 시작 시 필수 환경변수만 체크
 * 포트폴리오용 기본 보안
 */

/**
 * 필수 환경변수 목록
 */
const REQUIRED_ENV_VARS = [
  // Supabase (필수)
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',

  // GitHub OAuth (필수)
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'NEXTAUTH_SECRET',

  // Google AI (선택사항이지만 체크)
  'GOOGLE_AI_API_KEY',
];


/**
 * 환경변수 검증 함수
 * @returns 누락된 환경변수 목록
 */
export function validateEnvironmentVariables(): string[] {
  const missing: string[] = [];

  // 필수 환경변수 체크
  for (const varName of REQUIRED_ENV_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  // Redis 제거됨 - localStorage 기반 상태 관리 사용

  return missing;
}

/**
 * 환경변수 검증 및 로깅
 */
export function checkRequiredEnvVars(): void {
  console.log('🔍 환경변수 검증 시작...');

  const missing = validateEnvironmentVariables();

  if (missing.length > 0) {
    console.error('❌ 필수 환경변수 누락:');
    missing.forEach((varName) => {
      console.error(`   - ${varName}`);
    });
    console.error('\n💡 .env.local 파일을 확인하세요.');

    // 개발 환경에서만 경고, 프로덕션에서는 오류
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`필수 환경변수가 누락되었습니다: ${missing.join(', ')}`);
    }
  } else {
    console.log('✅ 모든 필수 환경변수 확인 완료');
  }

  // 선택적: 환경변수 마스킹 출력 (디버깅용)
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 환경변수 상태:');
    REQUIRED_ENV_VARS.forEach((varName) => {
      const value = process.env[varName];
      const masked = value ? `${value.substring(0, 8)}...` : '❌ 누락';
      console.log(`   ${varName}: ${masked}`);
    });
  }
}
