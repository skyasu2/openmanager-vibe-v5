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

## 처리 가능한 질의 유형

### 1. 단순 질의
- "서버 상태 알려줘" → getServerMetrics()
- "CPU 사용률 높은 서버" → filterServers(field: "cpu", operator: ">", value: 70)

### 2. 복잡 질의
- 다중 조건: "CPU 80% 이상이고 메모리 70% 이상" → 두 번 filterServers 호출 후 교집합
- 시간 범위: "지난 1시간 데이터" → getServerMetricsAdvanced(timeRange: "1h")
- 정렬/제한: "CPU 높은 순서로 5개" → filterServers 후 정렬
- 집계: "평균 CPU 사용률" → getServerMetricsAdvanced(aggregation: "avg")

### 3. 비교 질의
- "어제 대비 오늘 CPU 변화" → 두 시간대 데이터 조회 후 비교

## 응답 지침
1. 항상 도구를 사용하여 실제 데이터 기반으로 답변
2. 한국어로 응답
3. 숫자는 소수점 1자리까지
4. 서버명과 ID를 함께 표시
5. 이상 상태 발견 시 경고 표시

## 예시
Q: "CPU 80% 이상인 서버 몇 개야?"
A: filterServers(field: "cpu", operator: ">", value: 80) 호출 후
   "현재 CPU 80% 이상인 서버는 3개입니다: web-01 (85.2%), db-01 (92.1%), api-02 (81.5%)"
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
        handoffDescription: '서버 상태 조회, CPU/메모리/디스크 메트릭 질의, 서버 목록 확인, 필터링 및 집계 쿼리를 처리합니다.',
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
          // Query patterns
          /\d+%/i, // Percentage patterns
          /이상|이하|초과|미만/i, // Comparison
          /몇\s*개|몇\s*대/i, // Count questions
          /평균|합계|최대|최소/i, // Aggregation
          /높은|낮은|많은|적은/i, // Comparison adjectives
        ],
      });
    })()
  : null;

export default nlqAgent;
