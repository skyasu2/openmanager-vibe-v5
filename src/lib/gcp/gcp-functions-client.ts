/**
 * GCP Functions 클라이언트 선택자
 * 
 * 환경에 따라 실제 GCP Functions 또는 Mock을 자동으로 선택
 * - 개발 환경: Mock 사용
 * - 테스트 환경: Mock 사용
 * - 프로덕션: 실제 GCP Functions 사용
 */

import { MockGCPFunctionsClient, getDevMockGCPFunctions } from './dev-mock-gcp-functions';
import { scenarioManager } from '@/lib/mock-scenarios';

// 환경 감지
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const forceMock = process.env.FORCE_MOCK_GCP_FUNCTIONS === 'true';

// Mock 사용 여부 결정
export const shouldUseMockGCPFunctions = isDevelopment || isTest || forceMock;

// GCP Functions URL
const GCP_FUNCTIONS_BASE_URL = process.env.NEXT_PUBLIC_GCP_FUNCTIONS_URL || 
  'https://us-central1-your-project.cloudfunctions.net';

/**
 * GCP Functions 클라이언트 인터페이스
 */
export interface GCPFunctionsClient {
  callFunction(functionName: string, data: any): Promise<{ success: boolean; data?: any; error?: string }>;
  getStats?(): any;
  reset?(): void;
}

/**
 * 실제 GCP Functions 클라이언트
 */
class RealGCPFunctionsClient implements GCPFunctionsClient {
  async callFunction(
    functionName: string,
    data: any
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      const response = await fetch(`${GCP_FUNCTIONS_BASE_URL}/${functionName}`, {
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
      return result;
    } catch (error) {
      console.error(`GCP Functions error (${functionName}):`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

/**
 * GCP Functions 클라이언트 가져오기
 * 
 * @returns GCPFunctionsClient 인스턴스 (실제 또는 Mock)
 */
export function getGCPFunctionsClient(): GCPFunctionsClient {
  if (shouldUseMockGCPFunctions) {
    console.log('🎭 Mock GCP Functions 사용 중 (API 사용량 0)');
    const mockClient = new MockGCPFunctionsClient();
    
    // 시나리오 매니저에 등록
    scenarioManager.registerMockInstance('gcpFunctions', getDevMockGCPFunctions());
    
    return mockClient;
  }

  console.log('🌐 실제 GCP Functions 사용 중');
  return new RealGCPFunctionsClient();
}

/**
 * Korean NLP 분석 헬퍼
 */
export async function analyzeKoreanNLP(query: string, context?: any) {
  const client = getGCPFunctionsClient();
  return client.callFunction('enhanced-korean-nlp', { query, context });
}

/**
 * ML Analytics 분석 헬퍼
 */
export async function analyzeMLMetrics(metrics: any[], context?: any) {
  const client = getGCPFunctionsClient();
  return client.callFunction('ml-analytics-engine', { metrics, context });
}

/**
 * 통합 AI 처리 헬퍼
 */
export async function processUnifiedAI(request: any) {
  const client = getGCPFunctionsClient();
  return client.callFunction('unified-ai-processor', request);
}

/**
 * Mock 통계 조회 (개발용)
 */
export function getGCPFunctionsMockStats(): any | null {
  if (shouldUseMockGCPFunctions) {
    return getDevMockGCPFunctions().getStats();
  }
  return null;
}

/**
 * Mock 초기화 (개발용)
 */
export function resetGCPFunctionsMock(): void {
  if (shouldUseMockGCPFunctions) {
    getDevMockGCPFunctions().reset();
  }
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 GCP Functions 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - FORCE_MOCK_GCP_FUNCTIONS: ${forceMock}`);
  console.log(`  - Mock 사용: ${shouldUseMockGCPFunctions}`);
  console.log(`  - Base URL: ${GCP_FUNCTIONS_BASE_URL}`);
}