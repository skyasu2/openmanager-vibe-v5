/**
 * 🤖 AI 통합 쿼리 API v2.0 (Non-Streaming JSON)
 *
 * 4-모델 라우팅 아키텍처:
 * 1. Router (8B): llama-3.1-8b-instant로 빠른 복잡도 분류
 * 2. Simple (1-3): Gemini 2.5 Flash → Llama 8B 폴백
 * 3. Complex (4-5): Gemini 2.5 Pro → Llama 70B 폴백
 *
 * POST /api/ai/query
 */

import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { generateText, tool } from 'ai';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  checkGoogleAIRateLimit,
  getGoogleAIKey,
} from '@/lib/ai/google-ai-manager';
import {
  checkGroqAIRateLimit,
  type GroqModel,
  isGroqAIAvailable,
} from '@/lib/ai/groq-ai-manager';
import { classifyQuery } from '@/lib/ai/query-classifier';
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
// Model Configuration (4-Model Architecture)
// ============================================================================

/**
 * 모델 선택 결과
 */
interface ModelSelection {
  primary: ReturnType<typeof google> | ReturnType<typeof groq>;
  fallback: ReturnType<typeof groq> | null;
  primaryName: string;
  fallbackName: string | null;
  isComplex: boolean;
}

/**
 * 복잡도에 따른 모델 선택
 * - Simple (1-3): Flash 계열 (빠른 응답)
 * - Complex (4-5): Pro 계열 (깊은 분석)
 */
function selectModels(complexity: number): ModelSelection {
  const isComplex = complexity >= 4;

  const googleApiKey = getGoogleAIKey();
  const googleRateCheck = checkGoogleAIRateLimit();
  const groqAvailable = isGroqAIAvailable();
  const groqRateCheck = checkGroqAIRateLimit();

  const googleAvailable = googleApiKey && googleRateCheck.allowed;
  const groqAllowed = groqAvailable && groqRateCheck.allowed;

  // Complex (4-5): Pro 모델
  if (isComplex) {
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-pro'),
        fallback: groqAllowed ? groq('llama-3.3-70b-versatile') : null,
        primaryName: 'gemini-2.5-pro',
        fallbackName: groqAllowed ? 'llama-3.3-70b-versatile' : null,
        isComplex: true,
      };
    }
    // Google 불가 → Groq 70B 사용
    if (groqAllowed) {
      return {
        primary: groq('llama-3.3-70b-versatile'),
        fallback: null,
        primaryName: 'llama-3.3-70b-versatile',
        fallbackName: null,
        isComplex: true,
      };
    }
  }

  // Simple (1-3): Flash 모델
  if (googleAvailable) {
    return {
      primary: google('gemini-2.5-flash'),
      fallback: groqAllowed ? groq('llama-3.1-8b-instant') : null,
      primaryName: 'gemini-2.5-flash',
      fallbackName: groqAllowed ? 'llama-3.1-8b-instant' : null,
      isComplex: false,
    };
  }
  // Google 불가 → Groq 8B 사용
  if (groqAllowed) {
    return {
      primary: groq('llama-3.1-8b-instant'),
      fallback: null,
      primaryName: 'llama-3.1-8b-instant',
      fallbackName: null,
      isComplex: false,
    };
  }

  // 모든 AI 사용 불가
  throw new Error('AI API가 모두 사용 불가합니다 (Google AI, Groq)');
}

// ============================================================================
// POST Handler (4-Model Routing Architecture)
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

    // ============================================================
    // Step 1: Router (8B) - 빠른 복잡도 분류
    // ============================================================
    const classification = await classifyQuery(query);
    const { complexity, intent, reasoning: routingReason } = classification;

    console.log(
      `📡 [AI Router] Intent: ${intent}, Complexity: ${complexity}/5, Reason: ${routingReason}`
    );

    // ============================================================
    // Step 2: Model Selection (4-Model Architecture)
    // ============================================================
    let modelSelection: ModelSelection;
    try {
      modelSelection = selectModels(complexity);
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : 'AI 모델 선택 중 오류 발생',
        },
        { status: 500 }
      );
    }

    const { primary, fallback, primaryName, fallbackName, isComplex } =
      modelSelection;

    // ============================================================
    // Step 3: System Prompt 구성
    // ============================================================
    const systemPrompt = `당신은 **OpenManager Vibe**의 **AI 어시스턴트**입니다.
현재 모드: ${isComplex ? '🧠 Deep Reasoning (Pro)' : '⚡ Fast Response (Flash)'}
질문 의도: ${intent} (복잡도: ${complexity}/5)

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

**🚨 처리 전략 (4-Model Routing)**
- 복잡도 1-2: 단순 조회 → \`analyzePattern\`, \`recommendCommands\`
- 복잡도 3: 지식 기반 → \`searchKnowledgeBase\`
- 복잡도 4-5: 심층 분석 → \`callUnifiedProcessor\`

항상 팩트 기반으로 답변하고, 불확실할 경우 솔직히 모른다고 하십시오.
한국어로 응답하십시오.`;

    // ============================================================
    // Step 4: Primary Model 실행
    // ============================================================
    let responseText = '';
    let usedEngine = primaryName;
    let fallbackUsed = false;
    const thinkingSteps: string[] = [];

    if (includeThinking) {
      thinkingSteps.push(`🔍 Router: ${intent} (복잡도 ${complexity}/5)`);
      thinkingSteps.push(`🎯 선택된 모델: ${primaryName}`);
    }

    const tools = {
      analyzeRequest,
      callUnifiedProcessor,
      getServerMetrics,
      searchKnowledgeBase,
      analyzePattern,
      recommendCommands,
    };

    try {
      const result = await generateText({
        model: primary,
        messages: [{ role: 'user', content: query }],
        tools,
        system: systemPrompt,
        maxOutputTokens: isComplex ? 4096 : 2048,
        temperature: isComplex ? 0.7 : 0.5,
      });

      responseText = result.text || '응답을 생성하지 못했습니다.';

      // Tool calls 기록
      if (includeThinking && result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          const toolArgs = 'args' in toolCall ? toolCall.args : {};
          thinkingSteps.push(
            `🔧 ${toolCall.toolName}: ${JSON.stringify(toolArgs)}`
          );
        }
      }

      // 사용량 기록
      if (includeThinking && result.usage) {
        thinkingSteps.push(
          `📊 토큰: ${result.usage.totalTokens} (input: ${result.usage.inputTokens}, output: ${result.usage.outputTokens})`
        );
      }
    } catch (primaryError) {
      console.warn(
        `⚠️ Primary Model (${primaryName}) 실패:`,
        primaryError instanceof Error ? primaryError.message : primaryError
      );

      // ============================================================
      // Step 5: Fallback Model 실행
      // ============================================================
      if (fallback && fallbackName) {
        console.log(`🔄 Fallback 전환: ${primaryName} → ${fallbackName}`);

        if (includeThinking) {
          thinkingSteps.push(`⚠️ ${primaryName} 실패 → ${fallbackName} 전환`);
        }

        try {
          const fallbackResult = await generateText({
            model: fallback,
            messages: [{ role: 'user', content: query }],
            tools,
            system: systemPrompt + '\n(Note: Fallback model active)',
            maxOutputTokens: isComplex ? 4096 : 2048,
            temperature: isComplex ? 0.7 : 0.5,
          });

          responseText = fallbackResult.text || '응답을 생성하지 못했습니다.';
          usedEngine = fallbackName;
          fallbackUsed = true;

          // Tool calls 기록
          if (
            includeThinking &&
            fallbackResult.toolCalls &&
            fallbackResult.toolCalls.length > 0
          ) {
            for (const toolCall of fallbackResult.toolCalls) {
              const toolArgs = 'args' in toolCall ? toolCall.args : {};
              thinkingSteps.push(
                `🔧 ${toolCall.toolName}: ${JSON.stringify(toolArgs)}`
              );
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback Model도 실패:', fallbackError);
          throw primaryError; // 원래 오류 전파
        }
      } else {
        throw primaryError;
      }
    }

    const responseTime = Date.now() - startTime;

    // ============================================================
    // Step 6: 응답 반환
    // ============================================================
    return Response.json({
      response: responseText,
      thinkingSteps,
      engine: usedEngine,
      routing: {
        complexity,
        intent,
        reason: routingReason,
        isComplex,
      },
      fallbackUsed,
      fallbackReason: fallbackUsed
        ? `${primaryName} 실패 → ${fallbackName}`
        : undefined,
      responseTime,
      confidence: fallbackUsed ? 0.8 : isComplex ? 0.9 : 0.85,
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
