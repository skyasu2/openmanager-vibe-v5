/**
 * @deprecated v5.84.0 - Hybrid Architecture 전환
 *
 * ⚠️ DEPRECATED: 이 모듈은 Cloud Run으로 이관되었습니다.
 *
 * Hybrid Architecture 설계:
 * - Vercel = Frontend/Proxy Only (API 키 없음)
 * - Cloud Run = ALL AI processing (API 키 관리)
 *
 * 대체 방법:
 * - 임베딩: src/services/ai/embedding-service.ts (Cloud Run 프록시 사용)
 * - 생성: src/app/api/ai/google-ai/generate/route.ts (Cloud Run 프록시 사용)
 * - 프록시: src/lib/ai-proxy/proxy.ts (proxyToCloudRun 함수)
 *
 * 이 파일은 하위 호환성을 위해 유지되지만, 신규 코드에서는 사용하지 마세요.
 * Cloud Run 미활성화 시 폴백으로만 사용됩니다.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import debug from '@/utils/debug';
import { getGoogleAIKey, getGoogleAISecondaryKey } from './google-ai-manager';

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
 * @param modelName 모델 이름 (기본값: gemini-2.5-flash)
 * @returns 생성 모델 인스턴스
 */
export function getGoogleAIModel(modelName: string = 'gemini-2.5-flash') {
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
  const originalGenerateContent =
    generativeModel.generateContent.bind(generativeModel);
  generativeModel.generateContent = async (
    ...args: Parameters<typeof originalGenerateContent>
  ) => {
    try {
      debug.log(`API 호출 시도 (키: ${currentKeySource})`);
      return await originalGenerateContent(...args);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '';
      if (
        errorMessage.includes('429 Too Many Requests') &&
        currentKeySource === 'primary' &&
        secondaryKey
      ) {
        debug.warn('주 API 키 할당량 초과, 보조 API 키로 재시도...');
        client = getGoogleAIClient(secondaryKey);
        currentKeySource = 'secondary';
        generativeModel.generateContent = originalGenerateContent; // 재귀 호출 방지
        return await generativeModel.generateContent(...args);
      }
      throw error; // 다른 에러는 그대로 다시 throw
    }
  };

  return generativeModel;
}

// 환경 정보 로깅 - 모듈 레벨 코드 제거 (build-time evaluation 방지)
// getGoogleAIModel() 호출 시점에 필요한 로깅은 함수 내부(line 64)에서 수행됨
