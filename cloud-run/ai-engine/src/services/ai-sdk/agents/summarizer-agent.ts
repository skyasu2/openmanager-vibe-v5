/**
 * Summarizer Agent
 *
 * Specializes in quick summaries and key information extraction.
 * Uses OpenRouter free tier models (100% free usage).
 *
 * Model: OpenRouter qwen/qwen-2.5-7b-instruct:free (primary)
 * Fallback: OpenRouter meta-llama/llama-3.1-8b-instruct:free
 *
 * @version 1.0.0
 * @created 2026-01-01
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getSummarizerModel, checkProviderStatus } from '../model-provider';
import {
  getServerMetrics,
  getServerMetricsAdvanced,
} from '../../../tools-ai-sdk';

// ============================================================================
// Summarizer Agent Definition
// ============================================================================

const SUMMARIZER_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 요약 전문가입니다.

## 역할
복잡한 시스템 정보를 빠르고 간결하게 요약하여 핵심만 전달합니다.

## ⚠️ 중요: 실제 데이터 기반 응답
- **반드시 getServerMetrics 도구를 호출하여 실제 서버 데이터를 조회하세요**
- 가상의 서버명이나 임의의 수치를 생성하지 마세요
- 도구 응답에서 반환된 실제 값만 사용하세요

## 응답 원칙
1. **간결성**: 3-5줄 이내로 요약
2. **핵심 우선**: 가장 중요한 정보 먼저
3. **불릿 포인트**: 목록 형식 선호
4. **수치 포함**: 구체적 숫자 명시
5. **빠른 응답**: 불필요한 설명 제외

## 요약 유형

### 1. 상태 요약
- 전체 서버 수, 온라인/오프라인 현황
- 주요 메트릭 평균값
- 이상 징후 유무

### 2. 이슈 요약
- 문제 서버 목록 (상위 3개)
- 주요 원인
- 긴급도 표시

### 3. 트렌드 요약
- 변화 방향 (↑/↓/→)
- 주요 변화 수치
- 주의 필요 항목

## 응답 형식

### 상태 요약 예시
\`\`\`
📊 **서버 현황 요약**
• 전체: 10대 (온라인 8, 오프라인 2)
• 평균 CPU: 45%, 메모리: 62%
• ⚠️ 주의: db-02 메모리 89%
\`\`\`

### 이슈 요약 예시
\`\`\`
🚨 **이슈 요약**
• 영향: 3대 서버 (api-01, db-02, cache-01)
• 원인: 높은 메모리 사용률 (>85%)
• 긴급도: HIGH
\`\`\`

## 응답 지침
1. 항상 이모지로 시작 (📊/🚨/📈)
2. 볼드 제목 사용
3. 불릿 포인트 형식
4. 숫자는 구체적으로
5. 10줄 이내 유지
6. **한국어로 응답** (한자 절대 금지, 기술용어는 영어 허용)
`;

// ============================================================================
// Agent Instance (Graceful Degradation)
// ============================================================================

function createSummarizerAgent() {
  const status = checkProviderStatus();

  if (!status.openrouter) {
    console.warn('⚠️ [Summarizer Agent] Not available (OPENROUTER_API_KEY not configured)');
    return null;
  }

  try {
    const { model, modelId } = getSummarizerModel();
    console.log(`📝 [Summarizer Agent] Initialized with ${modelId}`);

    return new Agent({
      name: 'Summarizer Agent',
      model,
      instructions: SUMMARIZER_INSTRUCTIONS,
      tools: {
        getServerMetrics,
        getServerMetricsAdvanced,
      },
      // Description for orchestrator routing decisions
      handoffDescription: '빠른 상태 요약, 핵심 정보 추출, 간결한 현황 설명을 제공합니다. "요약해줘", "간단히 알려줘" 요청에 적합합니다.',
      matchOn: [
        // Summary keywords
        '요약',
        '간단히',
        '핵심',
        '줄여서',
        '짧게',
        'TL;DR',
        'tldr',
        'summary',
        // Quick keywords
        '빠르게',
        '간략히',
        '한마디로',
        '결론',
        // Patterns
        /요약.*해|간단.*알려/i,
        /핵심.*뭐|결론.*뭐/i,
        /줄여.*말해|짧게.*설명/i,
      ],
    });
  } catch (error) {
    console.warn('⚠️ [Summarizer Agent] Initialization failed:', error);
    return null;
  }
}

export const summarizerAgent = createSummarizerAgent();

export default summarizerAgent;
