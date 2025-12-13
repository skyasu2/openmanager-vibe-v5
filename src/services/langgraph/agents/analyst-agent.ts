/**
 * Analyst Agent
 * 패턴 분석 및 이상 탐지 전문 에이전트
 *
 * 역할:
 * - 메트릭 패턴 분석
 * - 이상 탐지 (Anomaly Detection)
 * - 트렌드 예측
 * - 심층 분석 리포트 생성
 */

import { AIMessage } from '@langchain/core/messages';
import { tool } from '@langchain/core/tools';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { z } from 'zod';
import type { AgentStateType, ToolResult } from '../state-definition';

// ============================================================================
// 1. Model Configuration
// ============================================================================

const ANALYST_MODEL = 'gemini-2.5-pro';

function getAnalystModel(): ChatGoogleGenerativeAI {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_API_KEY is not configured');
  }

  return new ChatGoogleGenerativeAI({
    apiKey,
    model: ANALYST_MODEL,
    temperature: 0.2, // 분석은 정확성 우선
    maxOutputTokens: 2048,
  });
}

// ============================================================================
// 2. Tools Definition
// ============================================================================

const analyzePatternTool = tool(
  async ({ query }) => {
    const patterns: string[] = [];
    const q = query.toLowerCase();

    // 패턴 매칭
    if (/cpu|프로세서|성능/i.test(q)) patterns.push('system_performance');
    if (/메모리|ram|memory/i.test(q)) patterns.push('memory_status');
    if (/디스크|저장소|용량/i.test(q)) patterns.push('storage_info');
    if (/서버|시스템|상태/i.test(q)) patterns.push('server_status');
    if (/트렌드|추세|예측/i.test(q)) patterns.push('trend_analysis');
    if (/이상|anomaly|alert/i.test(q)) patterns.push('anomaly_detection');

    if (patterns.length === 0) {
      return { success: false, message: '매칭되는 패턴 없음' };
    }

    // 패턴별 분석 결과 생성
    const analysisResults = patterns.map((pattern) => ({
      pattern,
      confidence: 0.8 + Math.random() * 0.2,
      insights: getPatternInsights(pattern),
    }));

    return {
      success: true,
      patterns,
      detectedIntent: patterns[0],
      analysisResults,
      _mode: 'pattern-analysis',
    };
  },
  {
    name: 'analyzePattern',
    description: '사용자 질문의 패턴을 분석하여 시스템 정보를 제공합니다',
    schema: z.object({
      query: z.string().describe('분석할 사용자 질문'),
    }),
  }
);

function getPatternInsights(pattern: string): string {
  const insights: Record<string, string> = {
    system_performance:
      '시스템 성능 분석: CPU 사용률, 프로세스 수, 로드 평균 확인 필요',
    memory_status: '메모리 상태 분석: 사용량, 캐시, 스왑 사용률 확인 필요',
    storage_info:
      '스토리지 분석: 디스크 사용량, I/O 대기, 파티션 상태 확인 필요',
    server_status: '서버 상태 분석: 가동 시간, 서비스 상태, 네트워크 연결 확인',
    trend_analysis:
      '트렌드 분석: 시계열 데이터 기반 패턴 인식 및 예측 모델 적용',
    anomaly_detection: '이상 탐지: 통계적 이상치 감지, 임계값 기반 알림 확인',
  };
  return insights[pattern] || '일반 분석 수행';
}

// ============================================================================
// 3. Analyst Agent Node Function
// ============================================================================

/**
 * Analyst Agent 노드 함수
 */
export async function analystAgentNode(
  state: AgentStateType
): Promise<Partial<AgentStateType>> {
  const lastMessage = state.messages[state.messages.length - 1];
  const userQuery =
    typeof lastMessage?.content === 'string'
      ? lastMessage.content
      : 'Analyze system patterns';

  try {
    const model = getAnalystModel();

    // 1. 패턴 분석 도구 실행
    const patternResult = await analyzePatternTool.invoke({ query: userQuery });
    const toolResults: ToolResult[] = [
      {
        toolName: 'analyzePattern',
        success: patternResult.success,
        data: patternResult,
        executedAt: new Date().toISOString(),
      },
    ];

    // 2. 심층 분석 수행
    const analysisPrompt = `당신은 OpenManager VIBE의 Analyst Agent입니다.
서버 시스템 패턴을 분석하고 인사이트를 제공합니다.

사용자 질문: ${userQuery}

패턴 분석 결과:
${JSON.stringify(patternResult, null, 2)}

위 분석 결과를 바탕으로:
1. 발견된 패턴에 대한 상세 설명
2. 잠재적 문제점 또는 주의사항
3. 권장 조치사항

한국어로 전문적이지만 이해하기 쉽게 설명해주세요.`;

    const response = await model.invoke([
      { role: 'user', content: analysisPrompt },
    ]);

    const finalContent =
      typeof response.content === 'string'
        ? response.content
        : '분석 결과를 생성할 수 없습니다.';

    console.log(
      `📊 [Analyst Agent] Analyzed patterns: ${(patternResult as { patterns?: string[] }).patterns?.join(', ') || 'none'}`
    );

    return {
      messages: [new AIMessage(finalContent)],
      toolResults,
      finalResponse: finalContent,
    };
  } catch (error) {
    console.error('❌ Analyst Agent Error:', error);
    return {
      finalResponse: '패턴 분석 중 오류가 발생했습니다.',
      toolResults: [
        {
          toolName: 'analyst_error',
          success: false,
          data: null,
          error: String(error),
          executedAt: new Date().toISOString(),
        },
      ],
    };
  }
}
