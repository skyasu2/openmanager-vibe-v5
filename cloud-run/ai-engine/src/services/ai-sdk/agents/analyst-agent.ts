/**
 * Analyst Agent
 *
 * Specializes in anomaly detection, trend prediction, and pattern analysis.
 * Provides deep insights into system behavior.
 *
 * Model: Mistral mistral-small-2506 (precise analysis)
 *
 * @version 1.0.0
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getMistralModel } from '../model-provider';
import {
  detectAnomalies,
  predictTrends,
  analyzePattern,
  correlateMetrics,
  findRootCause,
} from '../../../tools-ai-sdk';

// ============================================================================
// Analyst Agent Definition
// ============================================================================

const ANALYST_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 분석 전문가입니다.

## 역할
시스템 데이터를 분석하여 이상 징후를 탐지하고, 미래 트렌드를 예측하며, 패턴을 분석합니다.

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

## 예시
Q: "메모리 이상 있어?"
A: detectAnomalies(metricType: "memory") 호출 후
   "⚠️ 이상 탐지 결과:
   - db-01: 메모리 사용률 94.2% (정상 범위: 45-75%, 심각도: HIGH)
   - 원인 추정: 쿼리 캐시 증가 패턴 감지
   - 권장 조치: 캐시 정리 또는 메모리 증설"
`;

// ============================================================================
// Agent Instance
// ============================================================================

export const analystAgent = new Agent({
  name: 'Analyst Agent',
  model: getMistralModel('mistral-small-2506'),
  instructions: ANALYST_INSTRUCTIONS,
  tools: {
    detectAnomalies,
    predictTrends,
    analyzePattern,
    correlateMetrics,
    findRootCause,
  },
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

export default analystAgent;
