/**
 * Google AI 클라이언트 선택자
 * 
 * 환경에 따라 실제 Google AI 또는 Mock Google AI를 자동으로 선택
 * - 개발 환경: Mock 사용
 * - 테스트 환경: Mock 사용
 * - 프로덕션: 실제 API 사용 (환경변수로 강제 Mock 가능)
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { MockGoogleGenerativeAI, getDevMockGoogleAI } from './dev-mock-google-ai';
import googleAIManager from '@/lib/google-ai-manager';
import { scenarioManager } from '@/lib/mock-scenarios';

// 환경 감지
const isDevelopment = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const forceMock = process.env.FORCE_MOCK_GOOGLE_AI === 'true';

// Mock 사용 여부 결정
export const shouldUseMockGoogleAI = isDevelopment || isTest || forceMock;

/**
 * Google AI 클라이언트 가져오기
 * 
 * @returns Google Generative AI 인스턴스 (실제 또는 Mock)
 */
export function getGoogleAIClient(): GoogleGenerativeAI | MockGoogleGenerativeAI {
  if (shouldUseMockGoogleAI) {
    console.log('🎭 Mock Google AI 사용 중 (API 사용량 0)');
    const mockInstance = new MockGoogleGenerativeAI();
    
    // 시나리오 매니저에 등록
    scenarioManager.registerMockInstance('googleAI', getDevMockGoogleAI());
    
    return mockInstance;
  }

  // 실제 API 사용
  const apiKey = googleAIManager.getAPIKey();
  
  if (!apiKey) {
    console.warn('⚠️ Google AI API 키가 없습니다. Mock으로 폴백합니다.');
    const mockInstance = new MockGoogleGenerativeAI();
    scenarioManager.registerMockInstance('googleAI', getDevMockGoogleAI());
    return mockInstance;
  }

  console.log('🌐 실제 Google AI API 사용 중');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 모델 가져오기 헬퍼
 * 
 * @param modelName 모델 이름 (기본값: gemini-pro)
 * @returns 생성 모델 인스턴스
 */
export function getGoogleAIModel(modelName: string = 'gemini-pro') {
  const client = getGoogleAIClient();
  return client.getGenerativeModel({ model: modelName });
}

/**
 * Mock 통계 조회 (개발용)
 * 
 * @returns Mock 사용 통계 또는 null
 */
export function getMockStats(): Record<string, any> | null {
  if (shouldUseMockGoogleAI) {
    return getDevMockGoogleAI().getStats();
  }
  return null;
}

/**
 * Mock 시나리오 추가 (개발용)
 * 
 * @param name 시나리오 이름
 * @param keywords 트리거 키워드
 * @param responses 응답 목록
 * @param confidence 신뢰도 (0-1)
 */
export function addMockScenario(
  name: string,
  keywords: string[],
  responses: string[],
  confidence: number = 0.85
): void {
  if (shouldUseMockGoogleAI) {
    getDevMockGoogleAI().addScenario(name, keywords, responses, confidence);
  } else {
    console.warn('⚠️ Mock이 활성화되지 않은 상태에서 시나리오 추가 시도');
  }
}

/**
 * Mock 시나리오 시작 (개발용)
 * 
 * @param scenarioType 시나리오 타입
 */
export function startMockScenario(
  scenarioType: 'cascading-failure' | 'peak-load' | 'memory-leak' | 'network-partition' | 'random'
): void {
  if (shouldUseMockGoogleAI) {
    if (scenarioType === 'random') {
      scenarioManager.startRandomScenario();
    } else {
      scenarioManager.startServerScenario(scenarioType.replace('-', '') as any);
    }
  } else {
    console.warn('⚠️ Mock이 활성화되지 않은 상태에서 시나리오 시작 시도');
  }
}

/**
 * 활성 시나리오 조회 (개발용)
 * 
 * @returns 활성 시나리오 정보
 */
export function getActiveScenarios(): Record<string, any> | null {
  if (shouldUseMockGoogleAI) {
    return scenarioManager.getActiveScenarios();
  }
  return null;
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Google AI 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - FORCE_MOCK_GOOGLE_AI: ${forceMock}`);
  console.log(`  - Mock 사용: ${shouldUseMockGoogleAI}`);
}