/**
 * AI Agent 실시간 로그 스트리밍 API
 * 
 * 🚀 실시간 AI 로그 시스템 연동
 * - SSE (Server-Sent Events)를 통한 실시간 스트리밍
 * - WebSocket을 통한 양방향 통신
 * - 세션별 로그 관리
 * - 동적 로그 필터링
 */

import { NextRequest, NextResponse } from 'next/server';
import { RealTimeLogEngine } from '../../../../../../modules/ai-agent/core/RealTimeLogEngine';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  const action = searchParams.get('action') || 'stream';

  try {
    const logEngine = RealTimeLogEngine.getInstance();
    await logEngine.initialize();

    switch (action) {
      case 'stream':
        return handleSSEStream(request, sessionId);
      
      case 'session-logs':
        return handleSessionLogs(sessionId);
      
      case 'active-sessions':
        return handleActiveSessions();
      
      case 'log-patterns':
        return handleLogPatterns();
      
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Realtime Logs API Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '실시간 로그 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    const logEngine = RealTimeLogEngine.getInstance();

    switch (action) {
      case 'start-session':
        return handleStartSession(data);
      
      case 'add-log':
        return handleAddLog(data);
      
      case 'complete-session':
        return handleCompleteSession(data);
      
      case 'add-pattern':
        return handleAddPattern(data);
      
      case 'remove-pattern':
        return handleRemovePattern(data);
      
      default:
        return NextResponse.json({
          success: false,
          error: '지원하지 않는 액션입니다.'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Realtime Logs POST Error:', error);
    
    return NextResponse.json({
      success: false,
      error: '실시간 로그 처리 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

/**
 * SSE 실시간 스트리밍 처리
 */
async function handleSSEStream(request: NextRequest, sessionId: string | null) {
  const encoder = new TextEncoder();
  const logEngine = RealTimeLogEngine.getInstance();

  const stream = new ReadableStream({
    start(controller) {
      // SSE 헤더 전송
      controller.enqueue(encoder.encode('data: {"type":"connected","message":"실시간 로그 스트림 연결됨"}\n\n'));

      // 실시간 로그 이벤트 리스너
      const handleRealTimeLog = (log: any) => {
        // 세션 필터링
        if (sessionId && log.sessionId !== sessionId) return;
        
        const sseData = {
          type: 'log',
          data: log,
          timestamp: new Date().toISOString()
        };
        
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sseData)}\n\n`));
      };

      // 로그 엔진에 이벤트 리스너 등록
      logEngine.on('realTimeLog', handleRealTimeLog);

      // 정리 함수
      request.signal.addEventListener('abort', () => {
        logEngine.off('realTimeLog', handleRealTimeLog);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}

/**
 * 세션별 로그 조회
 */
async function handleSessionLogs(sessionId: string | null) {
  if (!sessionId) {
    return NextResponse.json({
      success: false,
      error: '세션 ID가 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  const logs = logEngine.getSessionLogs(sessionId);
  const session = logEngine.getActiveSession(sessionId);

  return NextResponse.json({
    success: true,
    data: {
      sessionId,
      session,
      logs,
      total: logs.length
    }
  });
}

/**
 * 활성 세션 목록 조회
 */
async function handleActiveSessions() {
  const logEngine = RealTimeLogEngine.getInstance();
  
  // 활성 세션 정보는 private이므로 public 메서드를 통해 접근해야 함
  // 여기서는 기본 정보만 반환
  return NextResponse.json({
    success: true,
    data: {
      message: '활성 세션 정보는 로그 엔진을 통해 확인 가능합니다.',
      timestamp: new Date().toISOString()
    }
  });
}

/**
 * 로그 패턴 정보 조회
 */
async function handleLogPatterns() {
  return NextResponse.json({
    success: true,
    data: {
      patterns: [
        { id: 'nodejs_init', description: 'NodeJS 초기화 패턴' },
        { id: 'redis_connection', description: 'Redis 연결 패턴' },
        { id: 'api_call', description: 'API 호출 패턴' },
        { id: 'nlp_processing', description: 'NLP 처리 패턴' },
        { id: 'ml_processing', description: 'ML 알고리즘 패턴' }
      ],
      total: 5
    }
  });
}

/**
 * 새 세션 시작
 */
async function handleStartSession(data: any) {
  const { questionId, question, metadata = {} } = data;
  
  if (!questionId || !question) {
    return NextResponse.json({
      success: false,
      error: 'questionId와 question이 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  const sessionId = logEngine.startSession(questionId, question, metadata);

  return NextResponse.json({
    success: true,
    data: { sessionId }
  });
}

/**
 * 로그 추가
 */
async function handleAddLog(data: any) {
  const { sessionId, logData } = data;
  
  if (!sessionId || !logData || !logData.message) {
    return NextResponse.json({
      success: false,
      error: 'sessionId와 logData.message가 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  logEngine.addLog(sessionId, logData);

  return NextResponse.json({
    success: true,
    message: '로그가 추가되었습니다.'
  });
}

/**
 * 세션 완료
 */
async function handleCompleteSession(data: any) {
  const { sessionId, result, answer } = data;
  
  if (!sessionId || !result) {
    return NextResponse.json({
      success: false,
      error: 'sessionId와 result가 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  logEngine.completeSession(sessionId, result, answer);

  return NextResponse.json({
    success: true,
    message: '세션이 완료되었습니다.'
  });
}

/**
 * 로그 패턴 추가
 */
async function handleAddPattern(data: any) {
  const { pattern } = data;
  
  if (!pattern || !pattern.id || !pattern.pattern || !pattern.extractor) {
    return NextResponse.json({
      success: false,
      error: '올바른 패턴 형식이 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  
  try {
    // 패턴 추가 (정규식 문자열을 RegExp로 변환)
    const logPattern = {
      ...pattern,
      pattern: new RegExp(pattern.pattern),
      extractor: new Function('match', pattern.extractor)
    };
    
    logEngine.addLogPattern(logPattern);

    return NextResponse.json({
      success: true,
      message: '로그 패턴이 추가되었습니다.'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '패턴 추가 중 오류가 발생했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 400 });
  }
}

/**
 * 로그 패턴 제거
 */
async function handleRemovePattern(data: any) {
  const { patternId } = data;
  
  if (!patternId) {
    return NextResponse.json({
      success: false,
      error: 'patternId가 필요합니다.'
    }, { status: 400 });
  }

  const logEngine = RealTimeLogEngine.getInstance();
  const removed = logEngine.removeLogPattern(patternId);

  return NextResponse.json({
    success: true,
    removed,
    message: removed ? '패턴이 제거되었습니다.' : '패턴을 찾을 수 없습니다.'
  });
} 