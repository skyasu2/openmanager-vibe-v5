/**
 * 🇰🇷 최적화된 한국어 NLP 엔진 싱글톤 인스턴스
 *
 * UnifiedAIEngineRouter와 다른 모듈에서 사용할 수 있는
 * OptimizedKoreanNLPEngine의 공유 인스턴스를 제공합니다.
 */

import { OptimizedKoreanNLPEngine } from './OptimizedKoreanNLPEngine';

// 싱글톤 인스턴스
let optimizedKoreanNLPEngineInstance: OptimizedKoreanNLPEngine | null = null;

/**
 * OptimizedKoreanNLPEngine 싱글톤 인스턴스 가져오기
 */
export function getOptimizedKoreanNLPEngine(): OptimizedKoreanNLPEngine {
  if (!optimizedKoreanNLPEngineInstance) {
    optimizedKoreanNLPEngineInstance = new OptimizedKoreanNLPEngine();
    console.log('✅ OptimizedKoreanNLPEngine 싱글톤 인스턴스 생성');
  }

  return optimizedKoreanNLPEngineInstance;
}

/**
 * 엔진 초기화 (앱 시작 시 호출)
 */
export async function initializeOptimizedKoreanNLP(): Promise<void> {
  const engine = getOptimizedKoreanNLPEngine();

  if (!engine.isReady()) {
    await engine.initialize();
    console.log('🚀 OptimizedKoreanNLPEngine 초기화 완료');
  }
}

/**
 * 엔진 상태 확인
 */
export function isOptimizedKoreanNLPReady(): boolean {
  return optimizedKoreanNLPEngineInstance?.isReady() || false;
}

// 기본 내보내기
export const optimizedKoreanNLPEngine = getOptimizedKoreanNLPEngine();
