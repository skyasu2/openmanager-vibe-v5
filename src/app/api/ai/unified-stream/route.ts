import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { type CoreMessage, streamText, tool } from 'ai';
import type { NextRequest } from 'next/server';
import * as z from 'zod';
import { getGoogleAIKey } from '@/lib/ai/google-ai-manager';
import { withAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import {
  type RoutingDecision,
  recordModelFailure,
  routeQueryEnhanced,
} from '@/services/ai/smart-routing-engine';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';

// Allow streaming responses up to 60 seconds (increased for Pro model)
export const maxDuration = 60;

// [Previous Tools Definition Omitted for Brevity - They are preserved in the file context or should be re-declared if replacing whole file.
// Since replace_file_content replaces a block, I need to be careful.
// The user prompt implies I should rewrite the file or careful replace.
// I will rewrite the Import section and the POST handler, keeping the tools in between if possible,
// BUT replace_file_content with Line 1-373 overwrites EVERYTHING.
// I must include all tools in the ReplacementContent to avoid deleting them.
// I will copy the tools from the previous `view_file` output]

// ... [The previous tools code is identical, so I will include them below] ...

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
        process.env.NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT;

      // GCP 엔드포인트 미설정 시 graceful fallback
      if (!gcpEndpoint) {
        return {
          success: false,
          error: 'GCP Unified Processor 엔드포인트가 설정되지 않았습니다.',
          _fallback_needed: true,
        };
      }

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
// 🧠 Main Handler with Dynamic Routing
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  try {
    const { messages }: { messages: CoreMessage[] } = await req.json();
    const apiKey = getGoogleAIKey();

    if (!apiKey) {
      return new Response('Google AI API Key not found', { status: 500 });
    }

    // 1. 유저의 마지막 질문 추출
    const lastMessage =
      messages.length > 0 ? messages[messages.length - 1] : null;
    const userQuery =
      lastMessage && typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'System status check';

    // 2. [Smart Router] 향상된 라우팅 결정 (Circuit Breaker + Load Balancing)
    let decision: RoutingDecision;
    try {
      decision = routeQueryEnhanced(userQuery);
      console.log(
        `📡 [AI Router] Decision: ${decision.primaryModel} (Level: ${decision.level})`
      );
    } catch (error) {
      console.error('❌ Router Error:', error);
      // Fallback if router fails completely
      return new Response('AI Service Unavailable: No models available', {
        status: 503,
      });
    }

    // 3. 모델 인스턴스 매핑
    // 타입 안전성을 위해 문자열 키로 매핑
    const getModelInstance = (modelId: string) => {
      switch (modelId) {
        case 'gemini-2.5-pro':
          return google('gemini-2.5-pro');
        case 'gemini-2.5-flash':
          return google('gemini-2.5-flash');
        case 'llama-3.3-70b-versatile':
          return groq('llama-3.3-70b-versatile');
        case 'llama-3.1-8b-instant':
          return groq('llama-3.1-8b-instant');
        case 'qwen-qwq-32b':
          return groq('qwen-qwq-32b');
        default:
          return google('gemini-2.5-flash'); // Ultimate fallback
      }
    };

    const primaryModel = getModelInstance(decision.primaryModel);
    const fallbackModel = decision.fallbackModel
      ? getModelInstance(decision.fallbackModel)
      : null;

    const systemPrompt = `당신은 **OpenManager Vibe**의 **AI 어시스턴트**입니다.
현재 모드: ${decision.level === 'thinking' ? '🧠 Deep Reasoning' : '⚡ Fast Response'} (${decision.primaryModel})
라우팅 이유: ${decision.reasoning.join(' -> ')}

목표: 정확하고 빠른 답변을 제공하십시오.

**도구 사용 가이드:**
- "서버 상태 어때?" -> \`getServerMetrics\`
- "장애 원인 분석해줘" -> \`callUnifiedProcessor\`
- "해결 방법 알려줘" -> \`searchKnowledgeBase\`
- 단순 상태 확인 -> \`analyzePattern\` (Offline)

항상 팩트 기반으로 답변하고, 불확실할 경우 솔직하게 모른다고 하십시오.`;

    // 4. 스트림 실행 및 에러 핸들링 (Circuit Breaker 연동)
    try {
      const result = await streamText({
        model: primaryModel,
        messages,
        system: systemPrompt,
        tools: {
          callUnifiedProcessor,
          getServerMetrics,
          searchKnowledgeBase,
          analyzePattern,
          recommendCommands,
        },
        onFinish: (_result) => {
          // 성공 기록 (Latency는 정확하지 않지만 대략적으로 사용)
          // streamText는 onFinish 시점에 전체 텍스트가 생성됨
          // 대략적인 성공 마킹
          // recordModelSuccess(decision.primaryModel, 1000);
          // Note: onFinish is client-side in some contexts, but here it's server.
          // We'll leave telemetry simpler for now to avoid complexity in this lambda.
        },
      });

      return result.toTextStreamResponse();
    } catch (error) {
      console.warn(
        `⚠️ Primary Model (${decision.primaryModel}) Failed. Error:`,
        error
      );

      // 실패 기록
      recordModelFailure(decision.primaryModel);

      // 5. Fallback 실행
      if (fallbackModel) {
        console.log(`🔄 Switching to Fallback: ${decision.fallbackModel}`);
        return streamText({
          model: fallbackModel,
          messages,
          system: `${systemPrompt}\n(Note: Fallback model active)`,
          tools: {
            callUnifiedProcessor,
            getServerMetrics,
            searchKnowledgeBase,
            analyzePattern,
            recommendCommands,
          },
        }).toTextStreamResponse();
      }

      throw error;
    }
  } catch (error) {
    console.error('❌ AI 스트리밍 처리 실패:', error);
    return new Response('AI streaming failed', { status: 500 });
  }
});
