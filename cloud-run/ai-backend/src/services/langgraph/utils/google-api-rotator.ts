/**
 * Google AI API Key Rotator
 *
 * 라운드 로빈 방식으로 2개의 Google AI API 키를 교대로 사용
 * - 단순 카운터 기반 교대
 * - 각 요청마다 다른 API 키 사용
 * - 할당량 분산으로 Rate Limit 완화
 */

import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// 전역 카운터 (메모리 내 상태)
let requestCounter = 0;

/**
 * API 키 목록 가져오기
 * GOOGLE_AI_API_KEY (필수) + GOOGLE_AI_API_KEY_2 (선택)
 */
function getApiKeys(): string[] {
  const keys: string[] = [];

  const key1 = process.env.GOOGLE_AI_API_KEY;
  const key2 = process.env.GOOGLE_AI_API_KEY_2;

  if (key1) keys.push(key1);
  if (key2) keys.push(key2);

  if (keys.length === 0) {
    throw new Error('GOOGLE_AI_API_KEY is not configured');
  }

  return keys;
}

/**
 * 라운드 로빈으로 다음 API 키 선택
 */
export function getNextApiKey(): string {
  const keys = getApiKeys();
  const index = requestCounter % keys.length;
  requestCounter++;

  console.log(
    `[API Rotator] Using key ${index + 1}/${keys.length} (request #${requestCounter})`
  );

  return keys[index];
}

/**
 * 현재 로테이션 상태 조회
 */
export function getRotationStatus(): {
  totalKeys: number;
  currentIndex: number;
  requestCount: number;
} {
  const keys = getApiKeys();
  return {
    totalKeys: keys.length,
    currentIndex: requestCounter % keys.length,
    requestCount: requestCounter,
  };
}

/**
 * Google AI 모델 생성 with 자동 키 로테이션
 *
 * @param model - Gemini 모델명 (e.g., 'gemini-2.5-flash-preview-05-20')
 * @param options - ChatGoogleGenerativeAI 추가 옵션
 */
export function createRotatingGoogleModel(
  model: string,
  options: {
    temperature?: number;
    maxOutputTokens?: number;
  } = {}
): ChatGoogleGenerativeAI {
  const apiKey = getNextApiKey();

  return new ChatGoogleGenerativeAI({
    apiKey,
    model,
    temperature: options.temperature ?? 0.3,
    maxOutputTokens: options.maxOutputTokens ?? 2048,
  });
}

/**
 * 로테이션 카운터 리셋 (테스트용)
 */
export function resetRotationCounter(): void {
  requestCounter = 0;
  console.log('[API Rotator] Counter reset');
}
