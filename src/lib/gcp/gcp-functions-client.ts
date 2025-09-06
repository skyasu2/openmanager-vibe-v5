/**
 * GCP Functions 클라이언트 - 탄력적 장애 대응 시스템
 *
 * ResilientAIClient를 사용하여 Circuit Breaker, 재시도, 캐시 기능 제공
 * Vercel 라우트를 fallback으로 활용하여 높은 가용성 보장
 */

import { 
  getResilientAIClient,
  analyzeKoreanNLPResilient,
  analyzeMLMetricsResilient,
  processUnifiedAIResilient
} from './resilient-ai-client';

// GCP Functions URL (레거시 지원)
const GCP_FUNCTIONS_BASE_URL =
  process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL ||
  'https://asia-northeast3-openmanager-free-tier.cloudfunctions.net';

/**
 * GCP Functions 클라이언트
 */
export class GCPFunctionsClient {
  async callFunction(
    functionName: string,
    data: unknown
  ): Promise<{ success: boolean; data?: unknown; error?: string }> {
    try {
      const url = `${GCP_FUNCTIONS_BASE_URL}/${functionName}`;
      console.log(`🌐 GCP Function 호출: ${functionName}`);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, data: result };
    } catch (error) {
      console.error(`❌ GCP Functions error (${functionName}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// 글로벌 클라이언트 인스턴스
let globalClient: GCPFunctionsClient | null = null;

/**
 * GCP Functions 클라이언트 가져오기
 *
 * @returns GCPFunctionsClient 인스턴스 (실제 API)
 */
export function getGCPFunctionsClient(): GCPFunctionsClient {
  if (!globalClient) {
    if (
      !GCP_FUNCTIONS_BASE_URL ||
      GCP_FUNCTIONS_BASE_URL.includes('your-project')
    ) {
      throw new Error(
        '⚠️ GCP Functions URL이 설정되지 않았습니다. .env.local을 확인하세요.'
      );
    }
    globalClient = new GCPFunctionsClient();
    console.log('🌐 실제 GCP Functions 사용 중');
  }
  return globalClient;
}

/**
 * Korean NLP 분석 헬퍼 (탄력적 버전)
 */
export async function analyzeKoreanNLP(query: string, context?: unknown) {
  return analyzeKoreanNLPResilient(query, context);
}

/**
 * ML Analytics 분석 헬퍼 (탄력적 버전)
 */
export async function analyzeMLMetrics(metrics: unknown[], context?: unknown) {
  return analyzeMLMetricsResilient(metrics, context);
}

/**
 * 통합 AI 처리 헬퍼 (탄력적 버전)
 */
export async function processUnifiedAI(request: unknown) {
  return processUnifiedAIResilient(request);
}

/**
 * 모니터링 및 상태 조회 헬퍼
 */
export function getAIClientStats() {
  const client = getResilientAIClient();
  return {
    circuitBreakers: client.getCircuitBreakerStatus(),
    cache: client.getCacheStats(),
  };
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 GCP Functions 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Base URL: ${GCP_FUNCTIONS_BASE_URL}`);
  console.log(`  - 실제 GCP Functions 사용`);
}
