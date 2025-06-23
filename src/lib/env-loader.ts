import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

/**
 * 🔧 환경변수 수동 로더
 * Next.js가 .env.local을 제대로 로드하지 못하는 경우를 위한 백업
 */

let envLoaded = false;

export function loadEnvironmentVariables(): void {
  if (envLoaded) return;

  try {
    const envPath = resolve(process.cwd(), '.env.local');

    if (existsSync(envPath)) {
      const envContent = readFileSync(envPath, 'utf8');
      const envLines = envContent.split('\n');

      envLines.forEach(line => {
        const trimmedLine = line.trim();
        if (trimmedLine && !trimmedLine.startsWith('#')) {
          const [key, ...valueParts] = trimmedLine.split('=');
          if (key && valueParts.length > 0) {
            const value = valueParts.join('=').trim();
            if (value && !process.env[key.trim()]) {
              process.env[key.trim()] = value;
            }
          }
        }
      });

      console.log('🔧 환경변수 수동 로딩 완료');
    } else {
      console.warn('⚠️ .env.local 파일을 찾을 수 없습니다');
    }
  } catch (error) {
    console.error('❌ 환경변수 로딩 실패:', error);
  }

  envLoaded = true;
}

/**
 * Google AI API 키 가져오기 (환경변수 자동 로딩 포함)
 */
export function getGoogleAIKeyWithFallback(): string | null {
  loadEnvironmentVariables();

  // 1순위: 환경변수
  let apiKey = process.env.GOOGLE_AI_API_KEY;

  // 2순위: .env.local에서 직접 읽기
  if (!apiKey) {
    try {
      const envPath = resolve(process.cwd(), '.env.local');
      if (existsSync(envPath)) {
        const envContent = readFileSync(envPath, 'utf8');
        const lines = envContent.split('\n');
        const googleAILine = lines.find(line =>
          line.trim().startsWith('GOOGLE_AI_API_KEY=')
        );

        if (googleAILine) {
          apiKey = googleAILine.split('=')[1]?.trim();
        }
      }
    } catch (error) {
      console.warn('⚠️ .env.local 직접 읽기 실패:', error);
    }
  }

  return apiKey || null;
}

/**
 * 환경변수 상태 확인
 */
export function checkEnvironmentStatus() {
  loadEnvironmentVariables();

  return {
    googleAIKey: !!process.env.GOOGLE_AI_API_KEY,
    googleAIEnabled: process.env.GOOGLE_AI_ENABLED === 'true',
    nodeEnv: process.env.NODE_ENV,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    redisUrl: !!process.env.REDIS_URL,
    envLocalExists: existsSync(resolve(process.cwd(), '.env.local')),
  };
}
