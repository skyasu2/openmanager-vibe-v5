/**
 * Reporter Agent
 * 인시던트 리포트 및 GraphRAG 기반 솔루션 검색 에이전트
 *
 * ## GraphRAG Enhancement (2025-12-26)
 * - Vector similarity + Graph traversal hybrid search
 * - Entity relationship awareness
 * - Multi-hop reasoning support
 *
 * ## 무료 티어 준수:
 * - Gemini text-embedding-004 (무료, 1,500 RPM)
 * - Supabase pgvector + GraphRAG (500MB 한도 내)
 * - On-demand only - 백그라운드 작업 금지
 */

import { AIMessage, HumanMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { AgentExecutionError, getErrorMessage } from '../lib/errors';
import { searchWithEmbedding, embedText } from '../lib/embedding';
import { hybridGraphSearch, getRelatedKnowledge } from '../lib/graph-rag-service';
import { getReporterModel } from '../lib/model-config';
import type {
  AgentStateType,
  PendingAction,
  ToolResult,
} from '../lib/state-definition';
// Phase 2: NLQ Tools 제거 - Shared Context 사용
import {
  buildReporterContext,
  formatContextForPrompt,
  type ReporterContext,
} from '../lib/shared-context';

// Tool Input Types (for TypeScript strict mode)
interface SearchKnowledgeBaseInput {
  query: string;
  category?: 'troubleshooting' | 'security' | 'performance';
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface RecommendCommandsInput {
  keywords: string[];
}

// ============================================================================
// 1. Supabase Client Singleton (성능 최적화)
// ============================================================================

import { getSupabaseConfig } from '../lib/config-parser';

// Supabase 클라이언트 인터페이스 (동적 import 호환, 최소 타입 정의)
interface SupabaseClientLike {
  rpc: (fn: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}

let supabaseInstance: SupabaseClientLike | null = null;

async function getSupabaseClient(): Promise<SupabaseClientLike | null> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  // Use config-parser for unified JSON secret support
  const config = getSupabaseConfig();

  if (!config) {
    console.warn('⚠️ [Reporter Agent] Supabase config missing');
    return null;
  }

  try {
    const { createClient } = await import('@supabase/supabase-js');
    supabaseInstance = createClient(config.url, config.serviceRoleKey) as unknown as SupabaseClientLike;
    return supabaseInstance;
  } catch (err) {
    console.error('⚠️ [Reporter Agent] Supabase client init failed:', err);
    return null;
  }
}

// ============================================================================
// 2. Tools Definition
// ============================================================================

export const searchKnowledgeBaseTool = tool(
  async ({ query, category, severity, useGraphRAG = true }: SearchKnowledgeBaseInput & { useGraphRAG?: boolean }) => {
    console.log(`🔍 [Reporter Agent] GraphRAG search for: ${query} (graph: ${useGraphRAG})`);

    // Supabase 클라이언트 가져오기 (Singleton)
    const supabase = await getSupabaseClient();

    if (!supabase) {
      console.warn('⚠️ [Reporter Agent] Supabase credentials missing, using fallback');
      return {
        success: true,
        results: [
          {
            id: 'fallback-1',
            title: '기본 문제 해결 가이드',
            content: '일반적인 문제 해결 절차: 1. 로그 확인 2. 리소스 사용량 체크 3. 서비스 재시작',
            category: 'troubleshooting',
            similarity: 0.8,
            sourceType: 'fallback',
            hopDistance: 0,
          },
        ],
        totalFound: 1,
        _source: 'Fallback (No Supabase)',
      };
    }

    try {
      // 1. Generate query embedding
      const queryEmbedding = await embedText(query);

      // 2. Use hybrid GraphRAG search if enabled
      if (useGraphRAG) {
        const hybridResults = await hybridGraphSearch(queryEmbedding, {
          similarityThreshold: 0.3,
          maxVectorResults: 5,
          maxGraphHops: 2,
          maxTotalResults: 10,
        });

        if (hybridResults.length > 0) {
          // Get graph-connected results
          const graphEnhanced = hybridResults.map((r) => ({
            id: r.id,
            title: r.title,
            content: r.content.substring(0, 500),
            category: 'auto', // Would need join to get actual category
            similarity: r.score,
            sourceType: r.sourceType,
            hopDistance: r.hopDistance,
          }));

          console.log(
            `📊 [Reporter Agent] GraphRAG found: ${hybridResults.filter((r) => r.sourceType === 'vector').length} vector, ${hybridResults.filter((r) => r.sourceType === 'graph').length} graph`
          );

          return {
            success: true,
            results: graphEnhanced,
            totalFound: graphEnhanced.length,
            _source: 'GraphRAG Hybrid (Vector + Graph)',
            graphStats: {
              vectorResults: hybridResults.filter((r) => r.sourceType === 'vector').length,
              graphResults: hybridResults.filter((r) => r.sourceType === 'graph').length,
            },
          };
        }
      }

      // 3. Fallback to traditional vector search
      const result = await searchWithEmbedding(supabase, query, {
        similarityThreshold: 0.3,
        maxResults: 5,
        category: category || undefined,
        severity: severity || undefined,
      });

      if (!result.success) {
        throw new Error(result.error || 'RAG search failed');
      }

      return {
        success: true,
        results: result.results.map((r) => ({
          ...r,
          sourceType: 'vector' as const,
          hopDistance: 0,
        })),
        totalFound: result.results.length,
        _source: 'Supabase pgvector (Vector Only)',
      };
    } catch (error) {
      console.error('❌ [Reporter Agent] RAG search error:', error);

      // 에러 시 기본 응답 반환 (서비스 중단 방지)
      return {
        success: true,
        results: [
          {
            id: 'error-fallback',
            title: '검색 오류 발생',
            content: `검색 중 오류가 발생했습니다. 로그 및 메트릭 기반 분석을 진행합니다. 오류: ${String(error)}`,
            category: 'error',
            similarity: 0,
            sourceType: 'fallback',
            hopDistance: 0,
          },
        ],
        totalFound: 1,
        _source: 'Error Fallback',
      };
    }
  },
  {
    name: 'searchKnowledgeBase',
    description: '과거 장애 이력 및 해결 방법을 검색합니다 (GraphRAG: Vector + Graph)',
    schema: z.object({
      query: z.string().describe('검색 쿼리'),
      category: z.string().optional().describe('카테고리 필터 (incident, troubleshooting, best_practice, command, architecture)'),
      severity: z.string().optional().describe('심각도 필터 (info, warning, critical)'),
      useGraphRAG: z.boolean().optional().describe('GraphRAG 하이브리드 검색 사용 여부 (기본: true)'),
    }),
  }
);

export const recommendCommandsTool = tool(
  async ({ keywords }: RecommendCommandsInput) => {
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
      {
        keywords: ['재시작', 'restart', '복구'],
        command: 'service restart <service_name>',
        description: '서비스 재시작',
      },
      {
        keywords: ['메모리', '정리', 'cache'],
        command: 'clear cache',
        description: '캐시 정리',
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
        matched.length > 0 ? matched : recommendations.slice(0, 3),
      _mode: 'command-recommendation',
    };
  },
  {
    name: 'recommendCommands',
    description: '사용자 질문에 적합한 CLI 명령어를 추천합니다',
    schema: z.object({
      keywords: z.array(z.string()).describe('질문에서 추출한 핵심 키워드'),
    }),
  }
);


// ============================================================================
// 3. Reporter Agent Node Function
// ============================================================================

export async function reporterAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'Generate incident report';

  try {
    const model = getReporterModel();
    const toolResults: ToolResult[] = [];

    // 1. RAG 검색 수행
    const ragResult = await searchKnowledgeBaseTool.invoke({
      query: userQuery,
    });
    toolResults.push({
      toolName: 'searchKnowledgeBase',
      success: ragResult.success,
      data: ragResult,
      executedAt: new Date().toISOString(),
    });

    // 2. Phase 2: Shared Context에서 NLQ/Analyst 결과 조회
    // (더 이상 직접 NLQ Tools를 호출하지 않음 - SRP 준수)
    const sessionId = state.sessionId || 'default';
    let sharedContext: ReporterContext = {};

    try {
      sharedContext = await buildReporterContext(sessionId);
      if (sharedContext.nlqResult || sharedContext.analystResult) {
        toolResults.push({
          toolName: 'sharedContextLookup',
          success: true,
          data: {
            hasNlqResult: !!sharedContext.nlqResult,
            hasAnalystResult: !!sharedContext.analystResult,
          },
          executedAt: new Date().toISOString(),
        });
        console.log(`📋 [Reporter] Using shared context from session: ${sessionId.slice(0, 8)}...`);
      }
    } catch (e) {
      console.warn('⚠️ [Reporter] Shared context lookup failed:', e);
    }

    // 3. 키워드 추출 및 명령어 추천
    const keywords = extractKeywords(userQuery);
    const commandResult = await recommendCommandsTool.invoke({ keywords });
    toolResults.push({
      toolName: 'recommendCommands',
      success: true,
      data: commandResult,
      executedAt: new Date().toISOString(),
    });

    // 3. 인시던트 리포트 생성 (Phase 2: Shared Context 기반)
    const contextPrompt = formatContextForPrompt(sharedContext);

    const reportPrompt = `당신은 OpenManager VIBE의 Reporter Agent입니다.
장애 분석 및 인시던트 리포트를 생성합니다.

## 사용자 요청
${userQuery}

## 지식베이스 검색 결과
${compressRagResult(ragResult as RAGResult)}

## 이전 에이전트 분석 결과
${contextPrompt}

## 추천 명령어
${compressCommandResult(commandResult as CommandResult)}

위 정보를 바탕으로 간결한 인시던트 리포트를 작성하세요:

### 📋 인시던트 요약
[2-3문장 요약]

### 🔍 원인 분석
[가능한 원인 1-3개]

### 💡 권장 조치
[단계별 해결 방안]

### ⌨️ 추천 명령어
[실행 가능한 명령어들]

한국어로 간결하게 작성하세요.`;

    const response = await model.invoke([
      new HumanMessage(reportPrompt),
    ]);

    const finalContent =
      typeof response.content === 'string'
        ? response.content
        : '리포트를 생성할 수 없습니다.';

    console.log(
      `📝 [Reporter Agent] Generated report with ${toolResults.length} tool results`
    );

    // Human-in-the-Loop: 인시던트 리포트 및 명령어 추천은 승인 필요
    const hasCommandRecommendations =
      commandResult.recommendations && commandResult.recommendations.length > 0;
    const isIncidentReport =
      userQuery.includes('장애') || userQuery.includes('인시던트');

    const pendingAction: PendingAction | null =
      hasCommandRecommendations || isIncidentReport
        ? {
            actionType: isIncidentReport ? 'incident_report' : 'system_command',
            description: isIncidentReport
              ? '인시던트 리포트가 생성되었습니다. 검토 후 승인해주세요.'
              : '시스템 명령어가 추천되었습니다. 실행 전 검토해주세요.',
            payload: {
              report: finalContent,
              commands: commandResult.recommendations,
            },
            requestedAt: new Date().toISOString(),
            requestedBy: 'reporter',
          }
        : null;

    return {
      messages: [new AIMessage(finalContent)],
      toolResults,
      finalResponse: pendingAction ? null : finalContent,
      requiresApproval: !!pendingAction,
      approvalStatus: pendingAction ? 'pending' : 'none',
      pendingAction,
    };
  } catch (error) {
    const agentError =
      error instanceof AgentExecutionError
        ? error
        : new AgentExecutionError(
            'reporter',
            error instanceof Error ? error : undefined
          );
    console.error('❌ Reporter Agent Error:', agentError.toJSON());
    return {
      finalResponse: '인시던트 리포트 생성 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'reporter_error',
          success: false,
          data: null,
          error: getErrorMessage(error),
          executedAt: new Date().toISOString(),
        },
      ],
    };
  }
}

// ============================================================================
// 4. Context Compression Functions (Token Optimization)
// ============================================================================

interface RAGResultItem {
  id?: string;
  title?: string;
  content?: string;
  category?: string;
  similarity?: number;
  sourceType?: string;
  hopDistance?: number;
}

interface RAGResult {
  success: boolean;
  results?: RAGResultItem[];
  totalFound?: number;
  _source?: string;
}

// Note: LogsResult, MetricsResult interfaces removed in Phase 2
// Reporter now uses Shared Context instead of direct NLQ tool calls

interface CommandRecommendation {
  command?: string;
  description?: string;
}

interface CommandResult {
  success: boolean;
  recommendations?: CommandRecommendation[];
}

/**
 * RAG 결과 압축 (상위 3개, 핵심 정보만)
 * Before: ~2,000 tokens → After: ~200 tokens
 */
function compressRagResult(ragResult: RAGResult): string {
  if (!ragResult.success || !ragResult.results?.length) {
    return '관련 지식 없음';
  }

  const topResults = ragResult.results.slice(0, 3);
  const compressed = topResults
    .map((r, i) => {
      const title = r.title || '제목 없음';
      const content = (r.content || '').slice(0, 100);
      const source = r.sourceType === 'graph' ? '[Graph]' : '[Vector]';
      return `${i + 1}. ${source} ${title}\n   ${content}...`;
    })
    .join('\n');

  return `검색 결과 ${ragResult.totalFound || 0}건 (상위 3개):\n${compressed}`;
}

// Note: compressLogResult, compressMetricsResult removed in Phase 2
// Reporter now uses formatContextForPrompt() from shared-context.ts

/**
 * 명령어 추천 결과 압축
 * Before: ~500 tokens → After: ~100 tokens
 */
function compressCommandResult(commandResult: CommandResult): string {
  if (!commandResult.success || !commandResult.recommendations?.length) {
    return '추천 명령어 없음';
  }

  return commandResult.recommendations
    .slice(0, 3)
    .map(r => `- \`${r.command}\`: ${r.description}`)
    .join('\n');
}

// ============================================================================
// 5. Keyword Extraction
// ============================================================================

function extractKeywords(query: string): string[] {
  const keywords: string[] = [];
  const q = query.toLowerCase();

  const patterns = [
    { regex: /서버|server/gi, keyword: '서버' },
    { regex: /상태|status/gi, keyword: '상태' },
    { regex: /에러|error|오류/gi, keyword: '에러' },
    { regex: /로그|log/gi, keyword: '로그' },
    { regex: /메모리|memory/gi, keyword: '메모리' },
    { regex: /cpu|프로세서/gi, keyword: 'cpu' },
    { regex: /디스크|disk/gi, keyword: '디스크' },
    { regex: /재시작|restart/gi, keyword: '재시작' },
    { regex: /장애|failure|incident/gi, keyword: '장애' },
  ];

  for (const pattern of patterns) {
    if (pattern.regex.test(q)) {
      keywords.push(pattern.keyword);
    }
  }

  return keywords.length > 0 ? keywords : ['일반', '조회'];
}
