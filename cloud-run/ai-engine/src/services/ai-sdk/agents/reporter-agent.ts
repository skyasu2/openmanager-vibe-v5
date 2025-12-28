/**
 * Reporter Agent
 *
 * Specializes in generating incident reports and timelines.
 * Creates structured documentation for incidents and events.
 *
 * Model: Mistral mistral-small-2506 (structured output)
 *
 * @version 1.0.0
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getMistralModel } from '../model-provider';
import {
  buildIncidentTimeline,
  findRootCause,
  correlateMetrics,
} from '../../../tools-ai-sdk';

// ============================================================================
// Reporter Agent Definition
// ============================================================================

const REPORTER_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 보고서 작성 전문가입니다.

## 역할
장애 보고서를 생성하고, 인시던트 타임라인을 구성하며, 영향도를 분석합니다.

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
// Agent Instance (Graceful Degradation)
// ============================================================================

function createReporterAgent() {
  try {
    const model = getMistralModel('mistral-small-2506');
    console.log('📋 [Reporter Agent] Initialized with mistral-small-2506');
    return new Agent({
      name: 'Reporter Agent',
      model,
      instructions: REPORTER_INSTRUCTIONS,
      tools: {
        buildIncidentTimeline,
        findRootCause,
        correlateMetrics,
      },
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
        '요약',
        '정리',
        'summary',
        // Patterns
        /보고서.*만들|생성/i,
        /장애.*정리|요약/i,
      ],
    });
  } catch (error) {
    console.warn('⚠️ [Reporter Agent] Not available (MISTRAL_API_KEY not configured)');
    return null;
  }
}

export const reporterAgent = createReporterAgent();

export default reporterAgent;
