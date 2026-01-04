/**
 * NLQ (Natural Language Query) Agent
 *
 * Handles all server data queries - from simple to complex:
 * - Simple: "서버 상태 요약", "CPU 높은 서버"
 * - Complex: "CPU > 80% AND 메모리 > 70%", "지난 1시간 에러 TOP 5"
 *
 * Model: Cerebras llama-3.3-70b (primary) - 24M tokens/day 무료
 * Fallback: Groq llama-3.3-70b-versatile (if Cerebras unavailable)
 *
 * @version 1.2.0 - Cerebras primary로 변경 (Groq 사용량 절약)
 */

import { Agent } from '@ai-sdk-tools/agents';
import { getGroqModel, getCerebrasModel, checkProviderStatus } from '../model-provider';
import {
  getServerMetrics,
  getServerMetricsAdvanced,
  filterServers,
} from '../../../tools-ai-sdk';

// ============================================================================
// Model Selection with Fallback
// ============================================================================

/**
 * Get NLQ model with fallback chain: Cerebras → Groq
 * Returns null if no model available (graceful degradation)
 *
 * Cerebras primary: 24M tokens/day 무료 티어 활용
 */
function getNlqModel(): { model: ReturnType<typeof getCerebrasModel>; provider: string; modelId: string } | null {
  const status = checkProviderStatus();

  // Primary: Cerebras (24M tokens/day 무료, 한국어 품질 우수)
  if (status.cerebras) {
    try {
      return {
        model: getCerebrasModel('llama-3.3-70b'),
        provider: 'cerebras',
        modelId: 'llama-3.3-70b',
      };
    } catch {
      console.warn('⚠️ [NLQ Agent] Cerebras unavailable, falling back to Groq');
    }
  }

  // Fallback: Groq
  if (status.groq) {
    return {
      model: getGroqModel('llama-3.3-70b-versatile'),
      provider: 'groq',
      modelId: 'llama-3.3-70b-versatile',
    };
  }

  // Return null instead of throwing (graceful degradation)
  console.warn('⚠️ [NLQ Agent] No model available (need CEREBRAS_API_KEY or GROQ_API_KEY)');
  return null;
}

// ============================================================================
// NLQ Agent Definition
// ============================================================================

const NLQ_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 자연어 질의(NLQ) 전문가입니다.

## 역할
사용자의 서버 관련 질문을 이해하고, 적절한 도구를 사용하여 정확한 답변을 제공합니다.

## 도구 사용 가이드

### getServerMetrics() - 현재 상태 조회
- "서버 상태 알려줘" → getServerMetrics()
- "CPU 높은 서버" → getServerMetrics() 호출 후 결과에서 필터링

### getServerMetricsAdvanced() - 시간 범위 집계 ⭐
**중요**: serverId 생략 시 전체 서버 데이터 + globalSummary(전체 평균/최대/최소) 반환

**timeRange 형식**: "last1h", "last6h", "last12h", "last24h"
**aggregation**: "avg", "max", "min", "current"

**예시 호출**:
- "지난 6시간 CPU 평균" → getServerMetricsAdvanced({ timeRange: "last6h", metric: "cpu", aggregation: "avg" })
- "1시간 메모리 최대" → getServerMetricsAdvanced({ timeRange: "last1h", metric: "memory", aggregation: "max" })
- "전체 서버 평균" → getServerMetricsAdvanced({ timeRange: "last6h", metric: "all" })

**응답 형식**:
\`\`\`json
{
  "servers": [...],
  "globalSummary": { "cpu_avg": 45.2, "cpu_max": 89, "cpu_min": 12 }
}
\`\`\`

→ globalSummary.cpu_avg가 전체 서버 평균입니다.

### filterServers() - 조건 필터링
- "CPU 80% 이상" → filterServers({ field: "cpu", operator: ">", value: 80 })

## 응답 지침
1. **반드시 도구를 호출**하여 실제 데이터 기반으로 답변
2. "평균", "최대", "지난 N시간" 질문 → getServerMetricsAdvanced 사용
3. globalSummary가 있으면 해당 값을 인용하여 답변
4. 숫자는 소수점 1자리까지
5. 이상 상태 발견 시 경고 표시
6. **한국어로 응답** (한자 절대 금지, 기술용어는 영어 허용)

## 예시
Q: "지난 6시간 CPU 평균 알려줘"
A: getServerMetricsAdvanced({ timeRange: "last6h", metric: "cpu", aggregation: "avg" }) 호출 후
   globalSummary.cpu_avg 값을 확인하여 "지난 6시간 전체 서버 CPU 평균은 45.2%입니다." 응답
`;

// ============================================================================
// Agent Instance (Lazy Initialization)
// ============================================================================

// Lazy model initialization - only created when nlqAgent is accessed
const modelConfig = getNlqModel();

// Export nlqAgent only if model is available
// Otherwise export null - callers must check for availability
export const nlqAgent = modelConfig
  ? (() => {
      console.log(`🔧 [NLQ Agent] Using ${modelConfig.provider}/${modelConfig.modelId}`);
      return new Agent({
        name: 'NLQ Agent',
        model: modelConfig.model,
        instructions: NLQ_INSTRUCTIONS,
        tools: {
          getServerMetrics,
          getServerMetricsAdvanced,
          filterServers,
        },
        // Description for orchestrator routing decisions
        handoffDescription: '서버 상태 조회, CPU/메모리/디스크 메트릭 질의, 시간 범위 집계(지난 N시간 평균/최대), 서버 목록 확인 및 필터링을 처리합니다.',
        // Pattern matching for auto-routing
        matchOn: [
          // Korean keywords
          '서버',
          '상태',
          '목록',
          '조회',
          '알려',
          '보여',
          // Metric types
          'cpu',
          'CPU',
          '메모리',
          'memory',
          '디스크',
          'disk',
          '네트워크',
          'network',
          // Time range keywords
          '지난',
          '시간',
          '전체',
          // Query patterns
          /\d+%/i, // Percentage patterns
          /이상|이하|초과|미만/i, // Comparison
          /몇\s*개|몇\s*대/i, // Count questions
          /평균|합계|최대|최소/i, // Aggregation
          /높은|낮은|많은|적은/i, // Comparison adjectives
          /지난\s*\d+\s*시간/i, // Time range pattern
        ],
      });
    })()
  : null;

export default nlqAgent;
