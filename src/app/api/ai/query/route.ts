/**
 * 🤖 AI 통합 쿼리 API (Non-Streaming JSON)
 *
 * AISidebarContent.tsx에서 사용하는 AI 쿼리 엔드포인트
 * unified-stream의 tools를 재사용하되 JSON 응답 반환
 *
 * POST /api/ai/query
 */

import { google } from '@ai-sdk/google';
import { generateText, tool } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  checkGoogleAIRateLimit,
  getGoogleAIKey,
} from '@/lib/ai/google-ai-manager';
import {
  checkGroqAIRateLimit,
  generateGroqText,
  isGroqAIAvailable,
} from '@/lib/ai/groq-ai-manager';
import { withAuth } from '@/lib/auth/api-auth';
import { createClient } from '@/lib/supabase/server';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { loadHourlyScenarioData } from '@/services/scenario/scenario-loader';

// 최대 실행 시간: 30초
export const maxDuration = 30;

// ============================================================================
// Tools (unified-stream과 동일)
// ============================================================================

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
      if (!gcpEndpoint) {
        throw new Error(
          'NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT is not configured'
        );
      }

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
          options: { ml_model: 'anomaly_detection' },
        }),
        signal: AbortSignal.timeout(15000),
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
        error: '통합 분석 중 오류가 발생했습니다.',
        _fallback_needed: true,
      };
    }
  },
});

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

const analyzeRequest = tool({
  description: '질문의 의도와 복잡도를 한 번에 분석합니다 (Thinking Step)',
  inputSchema: z.object({
    query: z.string().describe('사용자 질문'),
  }),
  execute: async ({ query }: { query: string }) => {
    const lowerQuery = query.toLowerCase();
    let intent = 'general';
    let complexity = 1;

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
      complexity = 4;
    } else if (lowerQuery.includes('추천') || lowerQuery.includes('방법')) {
      intent = 'guide';
      complexity = 3;
    }

    const recommendation =
      complexity >= 3
        ? 'unified-processor'
        : complexity >= 2
          ? 'rag-search'
          : 'offline-tool';

    return {
      intent,
      complexity,
      recommendation,
      reasoning: `의도: ${intent}, 복잡도: ${complexity} -> 전략: ${recommendation}`,
    };
  },
});

// ============================================================================
// Request/Response Types
// ============================================================================

interface QueryRequest {
  query: string;
  context?: string;
  temperature?: number;
  maxTokens?: number;
  includeThinking?: boolean;
  metadata?: {
    totalServers?: number;
    onlineServers?: number;
    warningServers?: number;
    criticalServers?: number;
    avgCpu?: number;
    avgMemory?: number;
    timestamp?: string;
  };
}

// ============================================================================
// POST Handler
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  const startTime = Date.now();

  try {
    const body: QueryRequest = await req.json();
    const { query, metadata, includeThinking = false } = body;

    if (!query || typeof query !== 'string') {
      return Response.json(
        { error: 'query 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    // AI 엔진 선택 로직: Google AI → Groq 폴백
    const googleApiKey = getGoogleAIKey();
    const googleRateCheck = checkGoogleAIRateLimit();
    const groqAvailable = isGroqAIAvailable();
    const groqRateCheck = checkGroqAIRateLimit();

    // 사용 가능한 엔진 결정
    let useGroqFallback = false;
    let engineReason = '';

    if (!googleApiKey) {
      if (groqAvailable && groqRateCheck.allowed) {
        useGroqFallback = true;
        engineReason = 'Google AI API 키 미설정 → Groq 폴백';
      } else {
        return Response.json(
          {
            error:
              'AI API 키가 설정되지 않았습니다 (Google AI, Groq 모두 사용 불가)',
          },
          { status: 500 }
        );
      }
    } else if (!googleRateCheck.allowed) {
      if (groqAvailable && groqRateCheck.allowed) {
        useGroqFallback = true;
        engineReason = `Google AI Rate Limit (${googleRateCheck.reason}) → Groq 폴백`;
        console.log(`⚠️ ${engineReason}`);
      } else {
        return Response.json(
          {
            error: `AI Rate Limit 초과: Google (${googleRateCheck.reason}), Groq (${groqRateCheck.reason || '키 미설정'})`,
          },
          { status: 429 }
        );
      }
    }

    // 메타데이터를 포함한 시스템 프롬프트 구성
    const systemPrompt = `당신은 **OpenManager Vibe**의 **AI 어시스턴트**입니다. (MVP/PoC 버전)
목표: GCP 무료 티어를 최대한 활용하여 정확하고 빠른 답변을 제공하는 것입니다.

**현재 대시보드 컨텍스트:**
${
  metadata
    ? `- 총 서버: ${metadata.totalServers || 0}개
- 정상 서버: ${metadata.onlineServers || 0}개
- 경고 서버: ${metadata.warningServers || 0}개
- 심각 서버: ${metadata.criticalServers || 0}개
- 평균 CPU: ${metadata.avgCpu || 0}%
- 평균 메모리: ${metadata.avgMemory || 0}%`
    : '메타데이터 없음'
}

**🚨 처리 전략 (Hybrid Engine - GCP 최적화)**
1. **analyzeRequest**를 가장 먼저 실행하여 전략을 수립하십시오.
2. **Simple (복잡도 1)**: \`analyzePattern\` 또는 \`recommendCommands\` (Offline)를 사용하십시오.
3. **Moderate (복잡도 2)**: \`searchKnowledgeBase\` (RAG)를 사용하십시오.
4. **Complex (복잡도 3-5)**: \`callUnifiedProcessor\` (GCP)를 적극 활용하십시오.

항상 팩트 기반으로 답변하고, 불확실할 경우 솔직하게 모른다고 하십시오.
한국어로 응답하십시오.`;

    // AI 호출: Groq 폴백 또는 Google Gemini
    let responseText = '';
    let usedEngine = '';
    const thinkingSteps: string[] = [];

    if (useGroqFallback) {
      // 🚀 Groq 폴백 사용 (llama-3.1-8b-instant)
      console.log(`🔄 Groq 폴백 사용: ${engineReason}`);

      const groqResult = await generateGroqText(query, {
        systemPrompt,
        maxTokens: 2048,
        temperature: 0.7,
      });

      if (!groqResult.success) {
        // Groq도 실패하면 에러 반환
        return Response.json(
          { error: `Groq API 오류: ${groqResult.error}` },
          { status: 500 }
        );
      }

      responseText = groqResult.text || '응답을 생성하지 못했습니다.';
      usedEngine = `groq/${groqResult.model || 'llama-3.1-8b-instant'}`;

      if (includeThinking) {
        thinkingSteps.push(`🔄 ${engineReason}`);
        if (groqResult.usage) {
          thinkingSteps.push(
            `📊 토큰: ${groqResult.usage.totalTokens} (prompt: ${groqResult.usage.promptTokens}, completion: ${groqResult.usage.completionTokens})`
          );
        }
      }
    } else {
      // 🌟 Google Gemini 2.5 Flash 사용 (기본) - 1.5는 단종 예정
      // Free tier: 10 RPM, 250 RPD (2.5 Flash) vs 5 RPM, 25 RPD (2.5 Pro)
      const result = await generateText({
        model: google('gemini-2.5-flash-preview-05-20'),
        messages: [{ role: 'user', content: query }],
        tools: {
          analyzeRequest,
          callUnifiedProcessor,
          getServerMetrics,
          searchKnowledgeBase,
          analyzePattern,
          recommendCommands,
        },
        system: systemPrompt,
      });

      responseText = result.text || '응답을 생성하지 못했습니다.';
      usedEngine = 'gemini-2.5-flash';

      // 사고 과정 추출 (tool calls)
      if (includeThinking && result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          const toolArgs = 'args' in toolCall ? toolCall.args : {};
          thinkingSteps.push(
            `🔧 ${toolCall.toolName}: ${JSON.stringify(toolArgs)}`
          );
        }
      }
    }

    const responseTime = Date.now() - startTime;

    // 응답 반환
    return Response.json({
      response: responseText,
      thinkingSteps,
      engine: usedEngine,
      fallbackUsed: useGroqFallback,
      fallbackReason: useGroqFallback ? engineReason : undefined,
      responseTime,
      confidence: useGroqFallback ? 0.8 : 0.85, // Groq는 약간 낮은 신뢰도
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 쿼리 처리 실패:', error);

    const responseTime = Date.now() - startTime;

    return Response.json(
      {
        error: 'AI 쿼리 처리 중 오류가 발생했습니다.',
        response:
          '죄송합니다. 일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        engine: 'error-fallback',
        responseTime,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
});
