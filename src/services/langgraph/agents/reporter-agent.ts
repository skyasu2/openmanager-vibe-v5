/**
 * Reporter Agent
 * 인시던트 리포트 및 RAG 기반 솔루션 검색 에이전트
 *
 * 역할:
 * - 장애 원인 분석 (RCA)
 * - 지식베이스(RAG) 검색
 * - 인시던트 리포트 생성
 * - 복구 방안 제안
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { SupabaseRAGEngine } from '@/services/ai/supabase-rag-engine';
import { AgentExecutionError, getErrorMessage } from '../errors';
import { getReporterModel } from '../model-config';
import type {
  AgentStateType,
  PendingAction,
  ToolResult,
} from '../state-definition';

// ============================================================================
// 2. Tools Definition
// ============================================================================

const searchKnowledgeBaseTool = tool(
  async ({ query }) => {
    try {
      const supabase = await createClient();
      const ragEngine = new SupabaseRAGEngine(supabase);

      const searchResult = await ragEngine.searchHybrid(query, {
        maxResults: 5,
        enableKeywordFallback: true,
      });

      if (!searchResult.success || searchResult.results.length === 0) {
        return {
          success: false,
          message: '관련된 문서를 찾을 수 없습니다.',
          _source: 'Supabase pgvector',
        };
      }

      return {
        success: true,
        results: searchResult.results.map((r) => ({
          content: r.content,
          similarity: r.similarity,
        })),
        totalFound: searchResult.results.length,
        _source: 'Supabase pgvector',
      };
    } catch (error) {
      console.error('❌ RAG 검색 실패:', error);
      return {
        success: false,
        error: '지식베이스 검색 오류',
        _source: 'Supabase pgvector',
      };
    }
  },
  {
    name: 'searchKnowledgeBase',
    description: '과거 장애 이력 및 해결 방법을 검색합니다 (RAG)',
    schema: z.object({
      query: z.string().describe('검색 쿼리'),
    }),
  }
);

const recommendCommandsTool = tool(
  async ({ keywords }) => {
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

/**
 * Reporter Agent 노드 함수
 */
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

    // 2. 키워드 추출 및 명령어 추천
    const keywords = extractKeywords(userQuery);
    const commandResult = await recommendCommandsTool.invoke({ keywords });
    toolResults.push({
      toolName: 'recommendCommands',
      success: true,
      data: commandResult,
      executedAt: new Date().toISOString(),
    });

    // 3. 인시던트 리포트 생성
    const reportPrompt = `당신은 OpenManager VIBE의 Reporter Agent입니다.
장애 분석 및 인시던트 리포트를 생성합니다.

## 사용자 요청
${userQuery}

## 지식베이스 검색 결과
${JSON.stringify(ragResult, null, 2)}

## 추천 명령어
${JSON.stringify(commandResult, null, 2)}

위 정보를 바탕으로 다음 형식의 인시던트 리포트를 작성하세요:

### 📋 인시던트 요약
[문제 상황 요약]

### 🔍 원인 분석
[가능한 원인들]

### 💡 권장 조치
[단계별 해결 방안]

### ⌨️ 추천 명령어
[실행 가능한 명령어들]

한국어로 작성하고, 전문적이면서도 이해하기 쉽게 설명해주세요.`;

    const response = await model.invoke([
      { role: 'user', content: reportPrompt },
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
      finalResponse: pendingAction ? null : finalContent, // 승인 대기 시 finalResponse 미설정
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
// 4. Helper Functions
// ============================================================================

function extractKeywords(query: string): string[] {
  const keywords: string[] = [];
  const q = query.toLowerCase();

  // 키워드 패턴 매칭
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
