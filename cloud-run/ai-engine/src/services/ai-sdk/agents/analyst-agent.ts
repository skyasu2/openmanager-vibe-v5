/**
 * Analyst Agent
 *
 * Specializes in anomaly detection, trend prediction, and pattern analysis.
 * Provides deep insights into system behavior.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
 * - 한국어 생성 품질 개선 (Mistral → Groq)
 *
 * @version 1.1.0 - 모델 변경
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getGroqModel, getCerebrasModel, checkProviderStatus } from '../model-provider';
import {
  detectAnomalies,
  predictTrends,
  analyzePattern,
  correlateMetrics,
  findRootCause,
  // 실제 서버 데이터 조회 도구 추가
  getServerMetrics,
  getServerMetricsAdvanced,
} from '../../../tools-ai-sdk';

// ============================================================================
// Analyst Agent Definition
// ============================================================================

const ANALYST_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 분석 전문가입니다.

## 역할
시스템 데이터를 분석하여 이상 징후를 탐지하고, 미래 트렌드를 예측하며, 패턴을 분석합니다.

## ⚠️ 중요: 실제 데이터 기반 응답
- **반드시 도구를 호출하여 실제 서버 데이터를 기반으로 분석하세요**
- 가상의 서버명이나 임의의 수치를 생성하지 마세요
- 도구 응답에서 반환된 실제 값만 사용하세요
- 분석 결과는 항상 실제 데이터에 근거해야 합니다

## 분석 유형

### 1. 이상 탐지 (Anomaly Detection)
- 6시간 이동평균 + 2σ 기반 이상치 탐지
- 갑작스런 스파이크/드롭 감지
- 정상 범위 이탈 서버 식별

### 2. 트렌드 예측 (Trend Prediction)
- 선형 회귀 기반 향후 추세 예측
- 리소스 고갈 시점 예측
- 용량 계획 지원

### 3. 패턴 분석 (Pattern Analysis)
- 주기적 패턴 (일간/주간) 식별
- 시즌성 분석
- 비정상 패턴 탐지

### 4. 근본 원인 분석 (Root Cause Analysis)
- 이상 발생 원인 추론
- 메트릭 간 상관관계 분석
- 연쇄 영향 파악

## 응답 지침
1. 데이터 기반의 객관적 분석 제공
2. 신뢰도/확률 수치 포함
3. 시각적으로 이해하기 쉬운 설명
4. 권장 조치사항 제안
5. 심각도에 따른 우선순위 제시
6. **한국어로 응답 / Respond in Korean** (한자 절대 금지 / No Chinese characters, 기술용어는 영어 허용 / Technical terms in English OK)

## 예시
Q: "메모리 이상 있어?"
A: detectAnomalies(metricType: "memory") 호출 후
   "⚠️ 이상 탐지 결과:
   - db-01: 메모리 사용률 94.2% (정상 범위: 45-75%, 심각도: HIGH)
   - 원인 추정: 쿼리 캐시 증가 패턴 감지
   - 권장 조치: 캐시 정리 또는 메모리 증설"
`;

// ============================================================================
// Model Selection with Fallback
// ============================================================================

/**
 * Get Analyst model with fallback chain: Groq → Cerebras
 * Returns null if no model available (graceful degradation)
 */
function getAnalystModel(): { model: ReturnType<typeof getGroqModel>; provider: string; modelId: string } | null {
  const status = checkProviderStatus();

  // Primary: Groq (한국어 생성 품질 우수)
  if (status.groq) {
    try {
      return {
        model: getGroqModel('llama-3.3-70b-versatile'),
        provider: 'groq',
        modelId: 'llama-3.3-70b-versatile',
      };
    } catch {
      console.warn('⚠️ [Analyst Agent] Groq unavailable, falling back to Cerebras');
    }
  }

  // Fallback: Cerebras
  if (status.cerebras) {
    return {
      model: getCerebrasModel('llama-3.3-70b'),
      provider: 'cerebras',
      modelId: 'llama-3.3-70b',
    };
  }

  console.warn('⚠️ [Analyst Agent] No model available (need GROQ_API_KEY or CEREBRAS_API_KEY)');
  return null;
}

// ============================================================================
// Agent Instance (Graceful Degradation)
// ============================================================================

function createAnalystAgent() {
  const modelConfig = getAnalystModel();
  if (!modelConfig) {
    return null;
  }

  console.log(`🔬 [Analyst Agent] Using ${modelConfig.provider}/${modelConfig.modelId}`);
  return new Agent({
    name: 'Analyst Agent',
    model: modelConfig.model,
    instructions: ANALYST_INSTRUCTIONS,
    tools: {
      // 실제 서버 데이터 조회 도구 추가
      getServerMetrics,
      getServerMetricsAdvanced,
      // 기존 분석 도구
      detectAnomalies,
      predictTrends,
      analyzePattern,
      correlateMetrics,
      findRootCause,
    },
    // Description for orchestrator routing decisions
    handoffDescription: '이상 탐지, 트렌드 예측, 패턴 분석, 근본 원인 분석(RCA), 상관관계 분석을 수행합니다. "왜?", "이상 있어?", "예측해줘" 질문에 적합합니다.',
    matchOn: [
      // Anomaly keywords
      '이상',
      '비정상',
      'anomaly',
      '스파이크',
      'spike',
      // Prediction keywords
      '예측',
      '트렌드',
      '추세',
      '향후',
      'predict',
      // Analysis keywords
      '분석',
      '패턴',
      '원인',
      '왜',
      // Patterns
      /이상\s*(있|징후|탐지)/i,
      /언제.*될|고갈/i, // Resource exhaustion
    ],
  });
}

export const analystAgent = createAnalystAgent();

export default analystAgent;
