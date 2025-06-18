/**
 * 🧠 AI 사고 과정 API 엔드포인트
 *
 * 실시간 AI 사고 과정 시각화를 위한 API
 * - POST: 새로운 사고 세션 시작
 * - GET: 사고 과정 상태 조회
 */

import { NextRequest, NextResponse } from 'next/server';
import { ThinkingProcessor } from '@/modules/ai-agent/core/ThinkingProcessor';
import { LangGraphThinkingProcessor } from '@/modules/ai-agent/core/LangGraphThinkingProcessor';
import { RealTimeAILogCollector } from '@/services/ai/logging/RealTimeAILogCollector';

const thinkingProcessor = new ThinkingProcessor();
const langGraphProcessor = LangGraphThinkingProcessor.getInstance();
const logCollector = RealTimeAILogCollector.getInstance();

/**
 * 🧠 사고 과정 상태 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const mode = searchParams.get('mode') || 'basic';

    if (sessionId) {
      // 특정 세션의 사고 과정 조회
      const session = thinkingProcessor.getThinkingSession(sessionId);
      const langGraphFlow = langGraphProcessor.getThinkingFlow(sessionId);

      return NextResponse.json({
        success: true,
        data: {
          session,
          langGraphFlow,
          isActive: session?.status === 'thinking',
          logs: logCollector.getRecentLogs(10),
        },
      });
    } else {
      // 전체 사고 과정 통계
      const stats = thinkingProcessor.getThinkingStats();
      const activeSessions = thinkingProcessor.getActiveThinkingSessions();

      return NextResponse.json({
        success: true,
        data: {
          stats,
          activeSessions: activeSessions.length,
          activeSessionIds: activeSessions.map(s => s.sessionId),
          systemStatus: {
            thinking: activeSessions.length > 0,
            totalProcessors: 2, // ThinkingProcessor + LangGraphThinkingProcessor
            mode: mode,
          },
        },
      });
    }
  } catch (error) {
    console.error('❌ AI 사고 과정 조회 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}

/**
 * 🧠 새로운 사고 세션 시작 (POST)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      query,
      mode = 'basic',
      useAdvanced = false,
      enableRealTimeLogs = true,
    } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: '질의가 필요합니다' },
        { status: 400 }
      );
    }

    // 사고 세션 시작
    const queryId = `query_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;

    // 기본 사고 프로세서 시작
    const thinkingSessionId = thinkingProcessor.startThinking(
      queryId,
      query,
      mode
    );

    // 고급 모드인 경우 LangGraph 프로세서도 시작
    let langGraphQueryId = null;
    if (useAdvanced) {
      langGraphQueryId = langGraphProcessor.startThinking(
        sessionId,
        query,
        mode
      );
    }

    // 실시간 로그 수집 시작
    if (enableRealTimeLogs) {
      logCollector.startProcess(sessionId, 'ai-thinking', query);
    }

    // 시뮬레이션된 사고 과정 단계들 추가
    setTimeout(() => {
      thinkingProcessor.addThinkingStep(
        thinkingSessionId,
        'analysis',
        '질의 분석',
        '사용자 질의의 의도와 컨텍스트를 분석합니다.'
      );
    }, 100);

    setTimeout(() => {
      thinkingProcessor.addThinkingStep(
        thinkingSessionId,
        'classification',
        '엔진 선택',
        'AI 엔진들 중 최적의 조합을 선택합니다.'
      );
    }, 500);

    setTimeout(() => {
      thinkingProcessor.addThinkingStep(
        thinkingSessionId,
        'processing',
        '병렬 추론',
        '선택된 엔진들이 병렬로 추론을 수행합니다.'
      );
    }, 1000);

    setTimeout(() => {
      thinkingProcessor.addThinkingStep(
        thinkingSessionId,
        'generation',
        '응답 생성',
        '추론 결과를 바탕으로 최종 응답을 생성합니다.'
      );
    }, 2000);

    setTimeout(() => {
      thinkingProcessor.completeThinking(thinkingSessionId, {
        answer: '사고 과정이 완료되었습니다.',
        confidence: 0.95,
        totalSteps: 4,
      });

      if (enableRealTimeLogs) {
        logCollector.stopProcess(sessionId);
      }
    }, 3000);

    return NextResponse.json({
      success: true,
      data: {
        sessionId,
        thinkingSessionId,
        langGraphQueryId,
        query,
        mode,
        useAdvanced,
        estimatedDuration: 3000,
        message: '🧠 AI 사고 과정이 시작되었습니다',
        endpoints: {
          status: `/api/ai/thinking?sessionId=${sessionId}`,
          stream: `/api/ai/thinking/stream?sessionId=${sessionId}`,
        },
      },
    });
  } catch (error) {
    console.error('❌ AI 사고 세션 시작 실패:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      },
      { status: 500 }
    );
  }
}
