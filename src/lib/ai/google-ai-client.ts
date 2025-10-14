/**
 * Google AI 클라이언트 - 실제 Google AI API 사용
 *
 * 실제 Google AI API를 직접 사용하여 일관된 응답 품질 보장
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import googleAIManager from '@/lib/google-ai-manager';

/**
 * Google AI 클라이언트 가져오기
 *
 * @returns Google Generative AI 인스턴스 (실제 API)
 */
export function getGoogleAIClient(): GoogleGenerativeAI {
  const apiKey = googleAIManager.getAPIKey();

  if (!apiKey) {
    throw new Error(
      '⚠️ Google AI API 키가 설정되지 않았습니다. .env.local을 확인하세요.'
    );
  }

  console.log('🌐 실제 Google AI API 사용 중');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 모델 가져오기 헬퍼
 *
 * @param modelName 모델 이름 (기본값: gemini-1.5-flash)
 * @returns 생성 모델 인스턴스
 */
export function getGoogleAIModel(modelName: string = 'gemini-1.5-flash') {
  const client = getGoogleAIClient();
  return client.getGenerativeModel({ model: modelName });
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('🔍 Google AI 환경 설정:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`  - 실제 Google AI API 사용`);
}

// Force rebuild: 2025-10-14T06:45:00Z
