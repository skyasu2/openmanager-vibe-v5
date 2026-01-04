/**
 * Reporter Agent
 *
 * Specializes in generating incident reports and timelines.
 * Creates structured documentation for incidents and events.
 *
 * Model: Groq llama-3.3-70b (primary) / Cerebras (fallback)
 * - 한국어 생성 품질 개선 (Mistral → Groq)
 * - 실제 서버 데이터 도구 추가
 * - GraphRAG 검색 도구 추가 (과거 장애 이력)
 *
 * @version 1.2.0 - RAG 도구 추가
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getGroqModel, getCerebrasModel, checkProviderStatus } from '../model-provider';
import {
  buildIncidentTimeline,
  findRootCause,
  correlateMetrics,
  // 실제 서버 데이터 조회 도구 추가
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,
  // RAG 검색 도구 추가 (v1.2.0)
  searchKnowledgeBase,
} from '../../../tools-ai-sdk';

// ============================================================================
// Reporter Agent Definition
// ============================================================================

const REPORTER_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 보고서 작성 전문가입니다.

## 역할
장애 보고서를 생성하고, 인시던트 타임라인을 구성하며, 영향도를 분석합니다.

## ⚠️ 중요: 실제 데이터 기반 응답
- **반드시 getServerMetrics 또는 getServerMetricsAdvanced 도구를 먼저 호출하여 실제 서버 데이터를 조회하세요**
- 가상의 서버명(서버 A, B, C)이나 가짜 수치를 생성하지 마세요
- 도구 응답에서 반환된 실제 서버 ID, 이름, 메트릭 값만 사용하세요
- 데이터가 없으면 "현재 데이터를 조회할 수 없습니다"라고 솔직하게 답변하세요

## 📚 과거 사례 참조 (GraphRAG)
- **searchKnowledgeBase 도구**를 사용하여 유사한 과거 장애 사례를 검색하세요
- 과거 해결 방법을 참고하여 권장 조치사항을 제안하세요
- 유사 장애 패턴이 있으면 보고서에 "유사 사례" 섹션을 추가하세요

## 보고서 유형

### 1. 장애 보고서 (Incident Report)
- 영향받은 서버/서비스 목록
- 발생 시간 및 지속 시간
- 영향 범위 (사용자 수, 트랜잭션 등)
- 근본 원인 분석 결과
- 조치 사항 및 재발 방지 대책

### 2. 타임라인 (Timeline)
- 시간순 이벤트 나열
- 각 이벤트의 영향 설명
- 조치 시점 및 결과
- 복구까지 소요 시간

### 3. 영향도 분석 (Impact Analysis)
- 서비스 영향도 (Critical/High/Medium/Low)
- 관련 메트릭 상관관계
- 연쇄 영향 분석

## 보고서 형식

\`\`\`
## 장애 보고서

### 개요
- 발생 시간: YYYY-MM-DD HH:mm
- 복구 시간: YYYY-MM-DD HH:mm
- 영향 시간: N시간 M분
- 심각도: Critical/High/Medium/Low

### 영향 범위
- 영향 서버: N대
- 영향 서비스: [서비스 목록]

### 타임라인
| 시간 | 이벤트 | 조치 |
|------|--------|------|
| ... | ... | ... |

### 근본 원인
[원인 설명]

### 재발 방지
[대책 목록]
\`\`\`

## 응답 지침
1. 구조화된 형식으로 작성
2. 시간은 항상 명시
3. 영향도는 수치로 표현
4. 객관적이고 간결한 서술
`;

// ============================================================================
// Model Selection with Fallback
// ============================================================================

/**
 * Get Reporter model with fallback chain: Groq → Cerebras
 * Returns null if no model available (graceful degradation)
 */
function getReporterModel(): { model: ReturnType<typeof getGroqModel>; provider: string; modelId: string } | null {
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
      console.warn('⚠️ [Reporter Agent] Groq unavailable, falling back to Cerebras');
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

  console.warn('⚠️ [Reporter Agent] No model available (need GROQ_API_KEY or CEREBRAS_API_KEY)');
  return null;
}

// ============================================================================
// Agent Instance (Graceful Degradation)
// ============================================================================

function createReporterAgent() {
  const modelConfig = getReporterModel();
  if (!modelConfig) {
    return null;
  }

  console.log(`📋 [Reporter Agent] Using ${modelConfig.provider}/${modelConfig.modelId}`);
  return new Agent({
    name: 'Reporter Agent',
    model: modelConfig.model,
    instructions: REPORTER_INSTRUCTIONS,
    tools: {
      // 실제 서버 데이터 조회 도구 (가장 중요)
      getServerMetrics,
      getServerMetricsAdvanced,
      filterServers,
      // RAG 검색 도구 (과거 장애 이력 및 해결 방법)
      searchKnowledgeBase,
      // 기존 분석 도구
      buildIncidentTimeline,
      findRootCause,
      correlateMetrics,
    },
    // Description for orchestrator routing decisions
    handoffDescription: '장애 보고서 생성, 인시던트 타임라인 구성, 영향도 분석 보고서를 작성합니다. "보고서 만들어줘", "장애 정리" 요청에 적합합니다.',
    matchOn: [
      // Report keywords
      '보고서',
      '리포트',
      'report',
      // Incident keywords
      '장애',
      '인시던트',
      'incident',
      '사고',
      // Timeline keywords
      '타임라인',
      'timeline',
      '시간순',
      // Summary keywords
      '정리',
      // Patterns
      /보고서.*만들|생성/i,
      /장애.*정리|요약/i,
    ],
  });
}

export const reporterAgent = createReporterAgent();

export default reporterAgent;
