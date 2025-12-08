/**
 * 🤖 AI 통합 쿼리 API v3.2 (PDF Support)
 *
 * * v3.2 Upgrade: PDF Text Extraction (backend-side) using pdf-parse.
 *
 * POST /api/ai/query
 */

import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { type CoreMessage, generateText, tool } from 'ai';
import type { NextRequest } from 'next/server';
// @ts-expect-error
import pdf from 'pdf-parse';
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

// 최대 실행 시간: 60초 (PDF 파싱 고려)
export const maxDuration = 60;

// ... [Existing Tools: callUnifiedProcessor, getServerMetrics, searchKnowledgeBase, analyzePattern, recommendCommands, analyzeRequest] ...
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
  images?: string[]; // Base64 encoded images
  documents?: { name: string; content: string }[]; // Base64 encoded docs (PDFs)
  context?: string;
  temperature?: number;
  maxTokens?: number;
  includeThinking?: boolean;
  thinking?: boolean;
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

// ... [Existing ModelSelection and selectModels] ...
interface ModelSelection {
  primary: ReturnType<typeof google> | ReturnType<typeof groq>;
  fallback: ReturnType<typeof groq> | ReturnType<typeof google> | null;
  primaryName: string;
  fallbackName: string | null;
  level: 1 | 2 | 3 | 4 | 5 | 'thinking' | 'multimodal';
  useTools: boolean;
  maxTokens: number;
  temperature: number;
}

function selectModels(
  complexity: number,
  thinking: boolean = false,
  hasImages: boolean = false
): ModelSelection {
  const googleApiKey = getGoogleAIKey();
  const googleRateCheck = checkGoogleAIRateLimit();
  const groqAvailable = isGroqAIAvailable();
  const groq8bCheck = checkGroqAIRateLimit('llama-3.1-8b-instant' as GroqModel);
  const groq70bCheck = checkGroqAIRateLimit(
    'llama-3.3-70b-versatile' as GroqModel
  );

  const googleAvailable = googleApiKey && googleRateCheck.allowed;
  const groq8bAllowed = groqAvailable && groq8bCheck.allowed;
  const groq70bAllowed = groqAvailable && groq70bCheck.allowed;

  if (hasImages) {
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-flash'),
        fallback: google('gemini-2.5-pro'),
        primaryName: 'gemini-2.5-flash',
        fallbackName: 'gemini-2.5-pro',
        level: 'multimodal',
        useTools: true,
        maxTokens: 4096,
        temperature: 0.5,
      };
    }
    throw new Error('이미지 분석을 위한 Google AI 모델 사용이 불가능합니다.');
  }

  if (thinking) {
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-pro'),
        fallback: groq70bAllowed ? groq('llama-3.3-70b-versatile') : null,
        primaryName: 'gemini-2.5-pro',
        fallbackName: groq70bAllowed ? 'llama-3.3-70b-versatile' : null,
        level: 'thinking',
        useTools: true,
        maxTokens: 8192,
        temperature: 0.7,
      };
    }
    if (groq70bAllowed) {
      return {
        primary: groq('llama-3.3-70b-versatile'),
        fallback: null,
        primaryName: 'llama-3.3-70b-versatile',
        fallbackName: null,
        level: 'thinking',
        useTools: true,
        maxTokens: 4096,
        temperature: 0.7,
      };
    }
  }

  if (complexity === 5) {
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-flash'),
        fallback: groq70bAllowed ? groq('llama-3.3-70b-versatile') : null,
        primaryName: 'gemini-2.5-flash',
        fallbackName: groq70bAllowed ? 'llama-3.3-70b-versatile' : null,
        level: 5,
        useTools: true,
        maxTokens: 4096,
        temperature: 0.6,
      };
    }
    if (groq70bAllowed) {
      return {
        primary: groq('llama-3.3-70b-versatile'),
        fallback: groq8bAllowed ? groq('llama-3.1-8b-instant') : null,
        primaryName: 'llama-3.3-70b-versatile',
        fallbackName: groq8bAllowed ? 'llama-3.1-8b-instant' : null,
        level: 5,
        useTools: true,
        maxTokens: 4096,
        temperature: 0.6,
      };
    }
  }

  if (complexity === 4) {
    if (groq70bAllowed) {
      return {
        primary: groq('llama-3.3-70b-versatile'),
        fallback: googleAvailable ? google('gemini-2.5-flash') : null,
        primaryName: 'llama-3.3-70b-versatile',
        fallbackName: googleAvailable ? 'gemini-2.5-flash' : null,
        level: 4,
        useTools: true,
        maxTokens: 4096,
        temperature: 0.5,
      };
    }
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-flash'),
        fallback: groq8bAllowed ? groq('llama-3.1-8b-instant') : null,
        primaryName: 'gemini-2.5-flash',
        fallbackName: groq8bAllowed ? 'llama-3.1-8b-instant' : null,
        level: 4,
        useTools: true,
        maxTokens: 4096,
        temperature: 0.5,
      };
    }
  }

  if (complexity >= 2 && complexity <= 3) {
    if (groq8bAllowed) {
      return {
        primary: groq('llama-3.1-8b-instant'),
        fallback: googleAvailable ? google('gemini-2.5-flash') : null,
        primaryName: 'llama-3.1-8b-instant',
        fallbackName: googleAvailable ? 'gemini-2.5-flash' : null,
        level: complexity as 2 | 3,
        useTools: true,
        maxTokens: 2048,
        temperature: 0.4,
      };
    }
    if (googleAvailable) {
      return {
        primary: google('gemini-2.5-flash'),
        fallback: null,
        primaryName: 'gemini-2.5-flash',
        fallbackName: null,
        level: complexity as 2 | 3,
        useTools: true,
        maxTokens: 2048,
        temperature: 0.4,
      };
    }
  }

  if (groq8bAllowed) {
    return {
      primary: groq('llama-3.1-8b-instant'),
      fallback: googleAvailable ? google('gemini-2.5-flash') : null,
      primaryName: 'llama-3.1-8b-instant',
      fallbackName: googleAvailable ? 'gemini-2.5-flash' : null,
      level: 1,
      useTools: false,
      maxTokens: 1024,
      temperature: 0.3,
    };
  }

  if (googleAvailable) {
    return {
      primary: google('gemini-2.5-flash'),
      fallback: null,
      primaryName: 'gemini-2.5-flash',
      fallbackName: null,
      level: 1,
      useTools: false,
      maxTokens: 1024,
      temperature: 0.3,
    };
  }

  throw new Error('AI API가 모두 사용 불가합니다 (Google AI, Groq)');
}

// ============================================================================
// POST Handler (5-Level Routing Architecture v3.2)
// ============================================================================

export const POST = withAuth(async (req: NextRequest) => {
  const startTime = Date.now();

  try {
    // 📂 Payload Parsing
    const body: QueryRequest = await req.json();
    const {
      images,
      documents,
      metadata,
      includeThinking = false,
      thinking = false,
    } = body;

    let { query } = body;

    if (
      (!query || typeof query !== 'string') &&
      !(images && images.length > 0) &&
      !(documents && documents.length > 0)
    ) {
      return Response.json(
        { error: 'query, images 또는 documents 파라미터가 필요합니다' },
        { status: 400 }
      );
    }

    // 📝 Document Parsing (PDF/TXT)
    let documentContext = '';
    const parsingSteps: string[] = [];

    if (documents && documents.length > 0) {
      parsingSteps.push(`📄 문서 ${documents.length}개 처리 시작`);

      for (const doc of documents) {
        try {
          let text = '';
          if (doc.name.toLowerCase().endsWith('.pdf')) {
            const buffer = Buffer.from(doc.content, 'base64');
            const data = await pdf(buffer);
            text = data.text;
            parsingSteps.push(
              `✅ PDF 파싱 성공: ${doc.name} (${text.length}자)`
            );
          } else {
            // TXT, MD, etc (assume base64 encoded text or just plain text if decoded)
            // Check if content is base64
            try {
              text = Buffer.from(doc.content, 'base64').toString('utf-8');
            } catch {
              text = doc.content;
            }
            parsingSteps.push(`✅ 텍스트 로드 성공: ${doc.name}`);
          }

          documentContext += `\n--- [Document: ${doc.name}] ---\n${text.slice(0, 30000)}\n---------------------------\n`; // 30k chars limit per doc for safety
        } catch (e: any) {
          console.error(`❌ 문서 파싱 실패 (${doc.name}):`, e);
          parsingSteps.push(`❌ 파싱 실패 (${doc.name}): ${e.message}`);
        }
      }
    }

    if (documentContext) {
      query += `\n\n[첨부 문서 내용]\n${documentContext}`;
    }

    // ============================================================
    // Step 1: Router (8B) - 빠른 복잡도 분류
    // ============================================================
    let complexity = 1;
    let intent = 'general';
    let routingReason = 'default';

    if (images && images.length > 0) {
      complexity = 5;
      intent = 'multimodal_analysis';
      routingReason = 'Image input detected -> Force Multimodal';
    } else if (documents && documents.length > 0) {
      // 문서가 있으면 분석 필요하므로 복잡도 상향
      complexity = 4; // Use Groq 70B or Gemini Flash
      intent = 'document_analysis';
      routingReason = 'Document attached';
    } else {
      const classification = await classifyQuery(query);
      complexity = classification.complexity;
      intent = classification.intent;
      routingReason = classification.reasoning;
    }

    // ============================================================
    // Step 2: Model Selection (5-Level Architecture)
    // ============================================================
    let modelSelection: ModelSelection;
    try {
      modelSelection = selectModels(
        complexity,
        thinking,
        !!(images && images.length > 0)
      );
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

    const {
      primary,
      fallback,
      primaryName,
      fallbackName,
      level,
      useTools,
      maxTokens,
      temperature,
    } = modelSelection;

    // ... [System Prompt & Tool Selection logic same as before but now includes documents in context implicitly] ...

    // Level 표시 문자열 생성
    const levelDisplay =
      level === 'multimodal'
        ? '🖼️ Vision (Gemini)'
        : level === 'thinking'
          ? '🧠 Thinking (Pro)'
          : level === 5
            ? '⚡ Advanced (Flash)'
            : level === 4
              ? '📊 Complex (70B)'
              : level >= 2
                ? '🔧 Tool-enabled (8B)'
                : '💬 Direct (8B)';

    const systemPrompt = `당신은 **OpenManager Vibe**의 **AI 어시스턴트**입니다.
현재 모드: ${levelDisplay}
질문 의도: ${intent} (복잡도: ${complexity}/5)
${thinking ? '🧠 **Thinking 모드 활성화**: 깊은 추론과 상세한 분석을 제공합니다.\n' : ''}
${documentContext ? '📄 **문서 첨부됨**: 제공된 문서 내용을 기반으로 답변하십시오.\n' : ''}

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

**🚨 처리 전략 (5-Level Routing v3.2)**
- Level 1: 간단한 인사, FAQ → 직접 응답 (도구 없이)
- Level 2-3: 서버 상태, 메트릭 조회 → \`getServerMetrics\`, \`searchKnowledgeBase\`
- Level 4: 복잡한 분석, 문서 요약 → \`callUnifiedProcessor\`
- Level 5: 고급 분석, 예측 → 모든 도구 활용
- Thinking: 심층 추론, 전략 수립 → 종합적 분석
- Multimodal: 이미지 분석 모드.

${useTools ? '**사용 가능한 도구:** getServerMetrics, searchKnowledgeBase, callUnifiedProcessor, analyzePattern, recommendCommands' : '**직접 응답 모드:** 도구 없이 즉시 답변합니다.'}

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
      if (parsingSteps.length > 0) thinkingSteps.push(...parsingSteps);
      thinkingSteps.push(`🔍 Router: ${intent} (복잡도 ${complexity}/5)`);
      thinkingSteps.push(`🎯 Level: ${level} → ${primaryName}`);
      thinkingSteps.push(`🔧 Tools: ${useTools ? '활성화' : '비활성화'}`);
      if (thinking) thinkingSteps.push(`🧠 Thinking 모드: 활성화`);
    }

    const allTools = {
      analyzeRequest,
      callUnifiedProcessor,
      getServerMetrics,
      searchKnowledgeBase,
      analyzePattern,
      recommendCommands,
    };

    const tools = useTools ? allTools : undefined;

    // messages 구성
    const userMessageContent: any[] = [{ type: 'text', text: query }];
    if (images && images.length > 0) {
      images.forEach((img) => {
        userMessageContent.push({ type: 'image', image: img });
      });
    }

    try {
      const result = await generateText({
        model: primary,
        messages: [
          { role: 'user', content: userMessageContent },
        ] as CoreMessage[],
        tools,
        system: systemPrompt,
        maxOutputTokens: maxTokens,
        temperature: temperature,
      });

      responseText = result.text || '응답을 생성하지 못했습니다.';

      if (includeThinking && result.toolCalls && result.toolCalls.length > 0) {
        for (const toolCall of result.toolCalls) {
          thinkingSteps.push(
            `🔧 ${toolCall.toolName}: ${JSON.stringify('args' in toolCall ? toolCall.args : {})}`
          );
        }
      }
      if (includeThinking && result.usage) {
        thinkingSteps.push(`📊 토큰: ${result.usage.totalTokens}`);
      }
    } catch (primaryError) {
      console.warn(`⚠️ Primary Model (${primaryName}) 실패:`, primaryError);

      if (fallback && fallbackName) {
        if (includeThinking)
          thinkingSteps.push(`⚠️ ${primaryName} 실패 → ${fallbackName} 전환`);

        try {
          // Fallback logic specific to multimodal (exclude images if needed)
          let fallbackMessages: CoreMessage[] = [
            { role: 'user', content: userMessageContent },
          ] as CoreMessage[];
          if (
            !fallbackName.includes('gemini') &&
            !fallbackName.includes('vision')
          ) {
            fallbackMessages = [{ role: 'user', content: query }]; // 문서 내용은 쿼리에 포함되어 있으므로 OK
          }

          const fallbackResult = await generateText({
            model: fallback,
            messages: fallbackMessages,
            tools,
            system: systemPrompt + '\n(Fallback mode)',
            maxOutputTokens: maxTokens,
            temperature: temperature,
          });

          responseText = fallbackResult.text || '응답을 생성하지 못했습니다.';
          usedEngine = fallbackName;
          fallbackUsed = true;

          if (includeThinking && fallbackResult.toolCalls) {
            for (const toolCall of fallbackResult.toolCalls) {
              thinkingSteps.push(`🔧 ${toolCall.toolName}`);
            }
          }
        } catch (fallbackError) {
          throw primaryError;
        }
      } else {
        throw primaryError;
      }
    }

    const responseTime = Date.now() - startTime;

    return Response.json({
      response: responseText,
      thinkingSteps,
      engine: usedEngine,
      routing: { level, complexity, intent },
      fallbackUsed,
      responseTime,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ AI 쿼리 처리 실패:', error);
    return Response.json(
      { error: 'AI 쿼리 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
});
