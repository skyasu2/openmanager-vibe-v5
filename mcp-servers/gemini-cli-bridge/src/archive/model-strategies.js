/**
 * 🚀 Gemini 모델별 최적화 전략
 * 각 모델의 특성에 맞춘 실행 전략 정의
 */

export const ModelStrategies = {
  // Flash 모델: 빠른 응답, 간단한 작업
  'gemini-2.0-flash': {
    timeout: 10000, // 10초
    args: ['--prompt', '-b'], // 헤드리스 모드로 더 빠르게
    fallback: null, // 폴백 없음 (이미 가장 빠른 모델)
    characteristics: {
      speed: 'very-fast',
      quality: 'good',
      cost: 'lowest',
      rateLimit: 'high',
    },
    bestFor: [
      '간단한 질문',
      '코드 스니펫 생성',
      '빠른 검증',
      '실시간 응답 필요',
    ],
  },

  // Pro 모델: 고품질 분석, 복잡한 작업
  'gemini-2.5-pro': {
    timeout: 30000, // 30초
    args: ['--prompt'], // 인터랙티브 모드 (더 나은 포맷팅)
    fallback: 'gemini-2.0-flash', // 실패 시 Flash로
    characteristics: {
      speed: 'moderate',
      quality: 'excellent',
      cost: 'moderate',
      rateLimit: 'moderate',
    },
    bestFor: [
      '복잡한 코드 분석',
      '아키텍처 설계',
      '심층 리뷰',
      '창의적 솔루션',
    ],
  },

  // 자동 선택 전략
  auto: {
    timeout: 20000,
    args: ['--prompt'],
    // 프롬프트 길이와 복잡도에 따라 모델 자동 선택
    selectModel: prompt => {
      const promptLength = prompt.length;
      const hasCodeBlock = prompt.includes('```');
      const isComplexQuery = /분석|설계|리뷰|검토|최적화/.test(prompt);

      if (promptLength > 500 || hasCodeBlock || isComplexQuery) {
        return 'gemini-2.5-pro';
      }
      return 'gemini-2.0-flash';
    },
  },
};

/**
 * 프롬프트 분석을 통한 최적 전략 선택
 */
export function selectOptimalStrategy(prompt, options = {}) {
  // 명시적 모델 지정 시
  if (options.model && ModelStrategies[options.model]) {
    return ModelStrategies[options.model];
  }

  // 자동 선택
  const autoStrategy = ModelStrategies.auto;
  const selectedModel = autoStrategy.selectModel(prompt);

  return {
    ...ModelStrategies[selectedModel],
    selectedModel,
    reason: `프롬프트 특성에 따라 ${selectedModel} 선택`,
  };
}

/**
 * 폴백 체인 구성
 */
export function buildFallbackChain(initialModel) {
  const chain = [];
  let currentModel = initialModel;

  while (currentModel && ModelStrategies[currentModel]) {
    chain.push(currentModel);
    currentModel = ModelStrategies[currentModel].fallback;
  }

  return chain;
}
