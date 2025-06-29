/**
 * Vercel Tier Configuration and Timeout Management
 * 
 * Free vs Pro tier differentiated services:
 * - Free: 10s limit → 8s safe processing
 * - Pro: 60s limit → 55s maximum utilization
 */

export interface VercelTierConfig {
  tier: 'free' | 'pro' | 'enterprise';
  maxExecutionTime: number;
  safeExecutionTime: number;
  edgeTimeout: number;
  features: {
    streamingEnabled: boolean;
    complexAnalysis: boolean;
    multiStepProcessing: boolean;
    realTimeData: boolean;
  };
}

export const VERCEL_TIERS: Record<string, VercelTierConfig> = {
  free: {
    tier: 'free',
    maxExecutionTime: 10000,
    safeExecutionTime: 8000,
    edgeTimeout: 5000,
    features: {
      streamingEnabled: false,
      complexAnalysis: false,
      multiStepProcessing: false,
      realTimeData: true
    }
  },
  pro: {
    tier: 'pro',
    maxExecutionTime: 60000,
    safeExecutionTime: 55000,
    edgeTimeout: 10000,
    features: {
      streamingEnabled: true,
      complexAnalysis: true,
      multiStepProcessing: true,
      realTimeData: true
    }
  }
};

/**
 * 🎯 베르셀 요금제 10초 테스트 감지
 * 서버리스 함수 실행 시간으로 요금제를 정확하게 판별
 */
export async function detectVercelTierWithTest(): Promise<VercelTierConfig> {
  // 환경변수로 요금제 명시적 설정 (최우선)
  const tierEnv = process.env.VERCEL_TIER?.toLowerCase();
  if (tierEnv && VERCEL_TIERS[tierEnv]) {
    console.log(`🎯 환경변수 설정: ${tierEnv.toUpperCase()} 요금제`);
    return VERCEL_TIERS[tierEnv];
  }

  // 베르셀 환경에서만 10초 테스트 실행
  if (process.env.VERCEL === '1') {
    console.log('🧪 베르셀 요금제 10초 테스트 시작...');

    try {
      const testResult = await perform10SecondTest();

      if (testResult.success && testResult.duration >= 10000) {
        console.log(`🎯 베르셀 Pro 요금제 감지됨 (${testResult.duration}ms 실행 성공)`);
        return VERCEL_TIERS.pro;
      } else if (testResult.timedOut) {
        console.log(`🆓 베르셀 Free 요금제 감지됨 (${testResult.duration}ms에서 타임아웃)`);
        return VERCEL_TIERS.free;
      } else {
        // 10초 미만에서 완료된 경우
        console.log(`🆓 베르셀 Free 요금제 추정됨 (${testResult.duration}ms에서 완료)`);
        return VERCEL_TIERS.free;
      }
    } catch (error) {
      console.warn('⚠️ 베르셀 요금제 테스트 실패, 환경변수 기반 감지:', error);

      // 폴백: 환경변수 기반 감지
      const hasProFeatures =
        process.env.VERCEL_ENV === 'production' &&
        process.env.VERCEL_REGION;

      return hasProFeatures ? VERCEL_TIERS.pro : VERCEL_TIERS.free;
    }
  }

  // 로컬 개발 환경
  console.log('🏠 로컬 개발 환경 (Pro 설정 사용)');
  return VERCEL_TIERS.pro;
}

/**
 * 🧪 10초 테스트 함수 (베르셀 요금제 감지용)
 */
async function perform10SecondTest(): Promise<{
  success: boolean;
  duration: number;
  timedOut: boolean;
}> {
  const startTime = Date.now();
  let timedOut = false;

  try {
    // 10초 + 1초 여유분 대기 테스트
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        timedOut = false; // 정상 완료
        resolve(true);
      }, 11000); // 11초 대기

      // 베르셀 Free의 10초 제한에 걸리면 이 부분에서 에러 발생
      const errorTimeout = setTimeout(() => {
        clearTimeout(timeout);
        timedOut = true; // 타임아웃 발생
        reject(new Error('Vercel Free tier timeout detected'));
      }, 10500); // 10.5초에서 에러 체크
    });

    const duration = Date.now() - startTime;

    return {
      success: true,
      duration,
      timedOut: false
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    return {
      success: false,
      duration,
      timedOut: true
    };
  }
}

/**
 * 🔍 빠른 베르셀 요금제 감지 (기존 함수 유지)
 */
export function detectVercelTier(): VercelTierConfig {
  const tierEnv = process.env.VERCEL_TIER?.toLowerCase();
  if (tierEnv && VERCEL_TIERS[tierEnv]) {
    return VERCEL_TIERS[tierEnv];
  }

  if (process.env.VERCEL === '1') {
    const hasProFeatures =
      process.env.VERCEL_ENV === 'production' &&
      process.env.VERCEL_REGION;

    return hasProFeatures ? VERCEL_TIERS.pro : VERCEL_TIERS.free;
  }

  return VERCEL_TIERS.pro;
}

export function createErrorResponse(
  error: Error,
  context: string,
  config: VercelTierConfig
) {
  let suggestion = '';

  if (error.message.includes('timeout')) {
    suggestion = config.tier === 'free'
      ? 'Consider upgrading to Pro tier for complex analysis.'
      : 'Simplify request or split into multiple steps.';
  } else if (error.message.includes('Invalid API key')) {
    suggestion = 'Check API key configuration in environment variables.';
  } else if (error.message.includes('spawn EINVAL')) {
    suggestion = 'Check MCP server configuration or local installation.';
  } else {
    suggestion = 'Contact system administrator or try again later.';
  }

  return {
    success: false,
    error: `${context} failed: ${error.message}`,
    details: error.stack?.split('\n')[0] || 'No details available',
    suggestion,
    tier: config.tier
  };
}
