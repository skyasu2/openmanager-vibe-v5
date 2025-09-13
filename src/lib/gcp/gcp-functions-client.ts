/**
 * GCP Functions 클라이언트 - 직접 호출 방식
 *
 * Google Cloud Functions에 직접 연결하여 실제 클라우드 환경 활용
 */

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
 * Korean NLP 분석 헬퍼 (직접 호출)
 */
export async function analyzeKoreanNLP(query: string, context?: unknown) {
  const client = getGCPFunctionsClient();
  return client.callFunction('enhanced-korean-nlp', { query, context });
}

/**
 * ML Analytics 분석 헬퍼 (직접 호출)
 */
export async function analyzeMLMetrics(metrics: unknown[], context?: unknown) {
  const client = getGCPFunctionsClient();
  return client.callFunction('ml-analytics-engine', { metrics, context });
}

/**
 * 통합 AI 처리 헬퍼 (직접 호출)
 */
export async function processUnifiedAI(request: unknown) {
  const client = getGCPFunctionsClient();
  return client.callFunction('unified-ai-processor', request);
}

/**
 * GCP Functions 상태 조회 (단순화)
 */
export function getGCPFunctionsStatus() {
  return {
    baseUrl: GCP_FUNCTIONS_BASE_URL,
    environment: process.env.NODE_ENV,
    directCall: true, // Circuit Breaker 비활성화
  };
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🌐 GCP Functions 직접 호출 모드:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - Base URL: ${GCP_FUNCTIONS_BASE_URL}`);
  console.log(`  - Circuit Breaker: 비활성화`);
  console.log(`  - Mock Fallback: 비활성화`);
  console.log(`  - 100% GCP Functions 사용`);
}
