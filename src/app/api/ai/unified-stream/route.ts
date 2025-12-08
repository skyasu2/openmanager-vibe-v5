/**
 * 🤖 AI 통합 스트리밍 API (Vercel AI SDK)
 *
 * 목표: 포트폴리오용 AI 어시스턴트 시뮬레이션 (MVP/PoC 최적화)
 * - 사용자 규모: 일일 5명, 동시 2명 예상
 * - 전략: Hybrid Engine (Local Speed + Cloud Intelligence)
 *
 * POST /api/ai/unified-stream
 */

import { google } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { getGoogleAIKey } from '@/lib/ai/google-ai-manager';
import { withAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// ============================================================================
// 📊 Action Tools (Execution Layer)
// ============================================================================

/**
 * 🚀 Tool: Unified AI Processor (GCP Cloud Functions)
 * 복잡한 분석 요청을 한 번에 처리 (NLP + ML + Server Analysis)
 */
const callUnifiedProcessor = tool({
  description:
    '복잡한 분석 요청을 통합 AI 프로세서로 처리합니다 (GCP Cloud Functions)',
  inputSchema: z.object({
    query: z.string().describe('사용자 질문'),
    processors: z
      .array(z.string())
      .describe(
        '실행할 프로세서 목록 (korean_nlp, ml_analytics, server_analyzer)'
      ),
  }),
  execute: async ({
    query,
    processors,
  }: {
    query: string;
    processors: string[];
  }) => {
    try {
      const gcpEndpoint =
        process.env.NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT || '';

      // 컨텍스트 데이터 로드 (서버 ID 등)
      const allServers = await loadHourlyScenarioData();
      const serverIds = allServers.map((s) => s.id);

      const response = await fetch(gcpEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          context: {
            server_ids: serverIds,
            timestamp: new Date().toISOString(),
          },
          processors,
          options: {
            ml_model: 'anomaly_detection',
          },
        }),
        signal: AbortSignal.timeout(15000), // 15초 타임아웃
      });

      if (!response.ok) {
        throw new Error(`Unified Processor API error: ${response.status}`);
      }

      const result = await response.json();

      return {
        success: true,
        data: result.data,
        timestamp: new Date().toISOString(),
        _source: 'GCP Unified AI Processor',
        _performance: result.performance,
      };
    } catch (error) {
      console.error('❌ Unified Processor 호출 실패:', error);
      return {
        success: false,
        error: '통합 분석 중 오류가 발생했습니다. 개별 도구를 시도합니다.',
        _fallback_needed: true,
      };
    }
  },
});

/**
 * 📊 Tool: 서버 메트릭 조회 (Local Simulation)
 */
const getServerMetrics = tool({
  description:
    '서버 CPU/메모리/디스크 상태를 조회합니다 (시나리오 기반 시뮬레이션)',
  inputSchema: z.object({
    serverId: z.string().optional().describe('조회할 서버 ID (선택)'),
    metric: z
      .enum(['cpu', 'memory', 'disk', 'all'])
      .describe('조회할 메트릭 타입'),
  }),
  execute: async ({
    serverId,
    metric: _metric,
  }: {
    serverId?: string;
    metric: 'cpu' | 'memory' | 'disk' | 'all';
  }) => {
    const allServers = await loadHourlyScenarioData();
    const target = serverId
      ? allServers.find((s) => s.id === serverId)
      : allServers;

    const servers = Array.isArray(target)
      ? target
      : target
        ? [target]
        : allServers;

    return {
      success: true,
      servers: servers.map((s) => ({
        id: s.id,
        name: s.name,
        status: s.status,
        cpu: s.cpu,
        memory: s.memory,
        disk: s.disk,
      })),
      summary: {
        total: servers.length,
        alertCount: servers.filter(
          (s) => s.status === 'warning' || s.status === 'critical'
        ).length,
      },
      timestamp: new Date().toISOString(),
      _dataSource: 'scenario-loader',
    };
  },
});

/**
 * 📚 Tool: RAG 지식베이스 검색 (Real RAG)
 */
const searchKnowledgeBase = tool({
  description: '과거 장애 이력 및 해결 방법을 검색합니다 (Real RAG)',
  inputSchema: z.object({
    query: z.string().describe('검색 쿼리'),
  }),
  execute: async ({ query }: { query: string }) => {
    try {
      const supabase = await createClient();
      const ragEngine = new SupabaseRAGEngine(supabase);

      const searchResult = await ragEngine.searchHybrid(query, {
        maxResults: 3,
        enableKeywordFallback: true,
      });

      if (!searchResult.success || searchResult.results.length === 0) {
        return {
          success: false,
          message: '관련된 문서를 찾을 수 없습니다.',
        };
      }

      return {
        success: true,
        results: searchResult.results.map((r) => ({
          content: r.content,
          similarity: r.similarity,
        })),
        _source: 'Supabase pgvector',
      };
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return { success: false, error: '지식베이스 검색 오류' };
    }
  },
});

/**
 * ⚡ Tool: 패턴 분석 (Offline Capability)
 */
const analyzePattern = tool({
  description:
    '사용자 질문의 패턴을 분석하여 즉각적인 시스템 정보를 제공합니다 (Offline)',
  inputSchema: z.object({
    query: z.string().describe('분석할 사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    const patterns: string[] = [];
    const q = query.toLowerCase();

    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');

    if (patterns.length === 0) {
      return { success: false, message: '매칭되는 패턴 없음' };
    }

    return {
      success: true,
      patterns,
      detectedIntent: patterns[0],
      _mode: 'offline-pattern-match',
    };
  },
});

/**
 * ⌨️ Tool: 명령어 추천 (Offline Capability)
 */
const recommendCommands = tool({
  description: '사용자 질문에 적합한 CLI 명령어를 추천합니다 (Offline)',
  inputSchema: z.object({
    keywords: z.array(z.string()).describe('질문에서 추출한 핵심 키워드'),
  }),
  execute: async ({ keywords }: { keywords: string[] }) => {
    const recommendations = [
      {
        keywords: ['서버', '목록', '조회'],
        command: 'list servers',
        description: '서버 목록 조회',
      },
      {
        keywords: ['상태', '체크', '확인'],
        command: 'status check',
        description: '시스템 상태 점검',
      },
      {
        keywords: ['로그', '분석', '에러'],
        command: 'analyze logs',
        description: '로그 분석',
      },
    ];

    const matched = recommendations.filter((rec) =>
      keywords.some((k) =>
        rec.keywords.some((rk) => rk.includes(k) || k.includes(rk))
      )
    );

    return {
      success: true,
      recommendations:
        matched.length > 0 ? matched : recommendations.slice(0, 2),
      _mode: 'offline-command-recommendation',
    };
  },
});

// ============================================================================
// 🧠 Thinking Tools (Cognitive Layer) - Optimized
// ============================================================================

/**
 * 💡 Thinking Tool: 통합 요청 분석 (Intent + Complexity)
 * 토큰 절약을 위해 두 단계를 하나로 통합
 */
const analyzeRequest = tool({
  description: '질문의 의도와 복잡도를 한 번에 분석합니다 (Thinking Step)',
  inputSchema: z.object({
    query: z.string().describe('사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    const lowerQuery = query.toLowerCase();
    let intent = 'general';
    let complexity = 1; // 1(Simple) ~ 5(Complex)

    // 의도 및 복잡도 분석 로직
    if (
      lowerQuery.includes('cpu') ||
      lowerQuery.includes('메모리') ||
      lowerQuery.includes('상태')
    ) {
      intent = 'monitoring';
      complexity = 2;
    } else if (
      lowerQuery.includes('장애') ||
      lowerQuery.includes('원인') ||
      lowerQuery.includes('분석')
    ) {
      intent = 'analysis';
      complexity = 4; // 복잡한 분석 필요
    } else if (lowerQuery.includes('추천') || lowerQuery.includes('방법')) {
      intent = 'guide';
      complexity = 3;
    }

    // 🆕 복잡도 임계값 조정 (GCP 무료 티어 활용 극대화)
    // 기존: 4-5 → GCP, 3 → RAG, 1-2 → Offline
    // 변경: 3-5 → GCP, 2 → RAG, 1 → Offline
    const recommendation =
      complexity >= 3
        ? 'unified-processor' // GCP 통합 프로세서 사용 (무료 200만 호출/월)
        : complexity >= 2
          ? 'rag-search' // RAG 검색 사용
          : 'offline-tool'; // 오프라인 도구 사용

    return {
      intent,
      complexity,
      recommendation,
      reasoning: `의도: ${intent}, 복잡도: ${complexity} -> 전략: ${recommendation}`,
    };
  },
});

/**
 * POST 핸들러
 */
export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { messages } = await req.json();
    const apiKey = getGoogleAIKey();

    if (!apiKey) {
      return new Response('Google AI API Key not found', { status: 500 });
    }

    const result = streamText({
      model: google('gemini-1.5-flash'),
      messages,
      tools: {
        // 🧠 Thinking Tools (Optimized)
        analyzeRequest,
        // 📊 Action Tools
        callUnifiedProcessor, // New!
        getServerMetrics,
        searchKnowledgeBase,
        analyzePattern,
        recommendCommands,
      },
      system: `당신은 **OpenManager Vibe**의 **AI 어시스턴트**입니다. (MVP/PoC 버전)
목표: GCP 무료 티어를 최대한 활용하여 정확하고 빠른 답변을 제공하는 것입니다.

**🚨 처리 전략 (Hybrid Engine - GCP 최적화)**
1. **analyzeRequest**를 가장 먼저 실행하여 전략을 수립하십시오.
2. **Simple (복잡도 1)**: \`analyzePattern\` 또는 \`recommendCommands\` (Offline)를 사용하십시오.
3. **Moderate (복잡도 2)**: \`searchKnowledgeBase\` (RAG)를 사용하십시오.
4. **Complex (복잡도 3-5)**: \`callUnifiedProcessor\` (GCP)를 적극 활용하십시오. 🆕

**도구 사용 가이드 (GCP 우선):**
- "서버 상태 어때?" -> \`callUnifiedProcessor\` (GCP, processors: ['server_analyzer'])
- "장애 원인 분석해줘" -> \`callUnifiedProcessor\` (GCP, processors: ['ml_analytics', 'server_analyzer'])
- "추천해줘", "방법 알려줘" -> \`callUnifiedProcessor\` (GCP, processors: ['korean_nlp'])
- 단순 상태 확인 -> \`analyzePattern\` (Offline)
- 명령어 질문 -> \`recommendCommands\` (Offline)
- "해결 방법 알려줘" -> \`searchKnowledgeBase\` (RAG)

⚡ GCP 무료 티어: 월 200만 호출 (일 ~32,000회) - 적극 활용하십시오!
항상 팩트 기반으로 답변하고, 불확실할 경우 솔직하게 모른다고 하십시오.`,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('❌ AI 스트리밍 처리 실패:', error);
    return new Response('AI streaming failed', { status: 500 });
  }
});
