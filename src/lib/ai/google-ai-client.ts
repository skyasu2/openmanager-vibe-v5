/**
 * Google AI 클라이언트 - 실제 Google AI API 사용
 *
 * 실제 Google AI API를 직접 사용하여 일관된 응답 품질 보장
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import googleAIManager, { getGoogleAIKey, getGoogleAISecondaryKey } from '@/lib/google-ai-manager';
import debug from '@/utils/debug';

/**
 * Google AI 클라이언트 가져오기
 *
 * @param apiKey 사용할 API 키
 * @returns Google Generative AI 인스턴스 (실제 API)
 */
export function getGoogleAIClient(apiKey: string): GoogleGenerativeAI {
  if (!apiKey) {
    throw new Error(
      '⚠️ Google AI API 키가 설정되지 않았습니다. .env.local을 확인하세요.'
    );
  }

  debug.log('🌐 실제 Google AI API 사용 중');
  return new GoogleGenerativeAI(apiKey);
}

/**
 * 모델 가져오기 헬퍼 (주/보조 키 폴백 로직 포함)
 *
 * @param modelName 모델 이름 (기본값: gemini-1.5-flash)
 * @returns 생성 모델 인스턴스
 */
export function getGoogleAIModel(modelName: string = 'gemini-1.5-flash') {
  const primaryKey = getGoogleAIKey();
  const secondaryKey = getGoogleAISecondaryKey();

  let client: GoogleGenerativeAI | null = null;
  let currentKeySource: 'primary' | 'secondary' | 'none' = 'none';

  if (primaryKey) {
    client = getGoogleAIClient(primaryKey);
    currentKeySource = 'primary';
  } else if (secondaryKey) {
    client = getGoogleAIClient(secondaryKey);
    currentKeySource = 'secondary';
  }

  if (!client) {
    throw new Error(
      '⚠️ Google AI API 키가 설정되지 않았습니다. .env.local을 확인하거나 팀 키를 잠금 해제하세요.'
    );
  }

  const generativeModel = client.getGenerativeModel({ model: modelName });

  // 기존 generateContent 호출을 래핑하여 폴백 로직 추가
  const originalGenerateContent = generativeModel.generateContent;
  generativeModel.generateContent = async function (...args: Parameters<typeof originalGenerateContent>) {
    try {
      debug.log(`API 호출 시도 (키: ${currentKeySource})`);
      return await originalGenerateContent.apply(this, args);
    } catch (error: any) {
      if (
        error.message?.includes('429 Too Many Requests') &&
        currentKeySource === 'primary' &&
        secondaryKey
      ) {
        debug.warn('주 API 키 할당량 초과, 보조 API 키로 재시도...');
        client = getGoogleAIClient(secondaryKey);
        currentKeySource = 'secondary';
        generativeModel.generateContent = originalGenerateContent; // 재귀 호출 방지
        return await generativeModel.generateContent.apply(this, args);
      }
      throw error; // 다른 에러는 그대로 다시 throw
    }
  };

  return generativeModel;
}

// 환경 정보 로깅
if (process.env.NODE_ENV === 'development') {
  debug.log('🔍 Google AI 환경 설정:');
  debug.log(`  - NODE_ENV: ${process.env.NODE_ENV}`);
  debug.log(`  - 실제 Google AI API 사용`);
  debug.log(`  - 주 API 키 사용 가능: ${!!getGoogleAIKey()}`);
  debug.log(`  - 보조 API 키 사용 가능: ${!!getGoogleAISecondaryKey()}`);
}
