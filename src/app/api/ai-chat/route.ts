/**
 * 🤖 제3자 AI 대화 API
 * 다양한 AI 서비스와 직접 대화할 수 있는 REST API
 */

import { NextRequest, NextResponse } from 'next/server';
import { AIConversationManager } from '@/modules/third-party-ai-chat/core/AIConversationManager';

// 전역 대화 관리자 인스턴스
let globalChatManager: AIConversationManager | null = null;

function getChatManager(): AIConversationManager {
  if (!globalChatManager) {
    globalChatManager = new AIConversationManager();
  }
  return globalChatManager;
}

/**
 * GET: 상태 조회 및 세션 목록
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'status';
    const sessionId = searchParams.get('sessionId');

    const chatManager = getChatManager();

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            availableProviders: chatManager.getAvailableProviders(),
            currentSession: chatManager.getCurrentSession(),
            totalSessions: chatManager.getSessions().length,
            timestamp: new Date().toISOString(),
          },
          message: '🤖 AI 대화 시스템이 준비되었습니다.',
        });

      case 'sessions':
        return NextResponse.json({
          success: true,
          data: {
            sessions: chatManager.getSessions(),
            currentSessionId: chatManager.getCurrentSession()?.id || null,
          },
          message: '대화 세션 목록을 조회했습니다.',
        });

      case 'session':
        if (!sessionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'sessionId 파라미터가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const session = chatManager.getSession(sessionId);
        if (!session) {
          return NextResponse.json(
            {
              success: false,
              error: `세션을 찾을 수 없습니다: ${sessionId}`,
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: { session },
          message: '세션 정보를 조회했습니다.',
        });

      case 'providers':
        return NextResponse.json({
          success: true,
          data: {
            providers: chatManager.getAvailableProviders(),
          },
          message: '사용 가능한 AI 제공자 목록입니다.',
        });

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 대화 API GET 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST: 대화 시작, 메시지 전송, 세션 관리
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, provider, message, sessionId, title } = body;

    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'action 필드가 필요합니다.',
        },
        { status: 400 }
      );
    }

    const chatManager = getChatManager();

    switch (action) {
      case 'start':
        if (!provider) {
          return NextResponse.json(
            {
              success: false,
              error: 'provider 필드가 필요합니다.',
            },
            { status: 400 }
          );
        }

        try {
          const newSessionId = await chatManager.startConversation(
            provider,
            title
          );
          const session = chatManager.getSession(newSessionId);

          return NextResponse.json({
            success: true,
            data: {
              sessionId: newSessionId,
              session,
            },
            message: `🚀 ${provider} AI와의 대화를 시작했습니다.`,
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
            },
            { status: 400 }
          );
        }

      case 'send':
        if (!message) {
          return NextResponse.json(
            {
              success: false,
              error: 'message 필드가 필요합니다.',
            },
            { status: 400 }
          );
        }

        try {
          const startTime = Date.now();
          const response = await chatManager.sendMessage(message, sessionId);
          const processingTime = Date.now() - startTime;

          return NextResponse.json({
            success: true,
            data: {
              response,
              session: chatManager.getSession(
                response.provider === chatManager.getCurrentSession()?.provider
                  ? chatManager.getCurrentSession()?.id || ''
                  : ''
              ),
              processingTime,
            },
            message: '💬 AI 응답을 받았습니다.',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
            },
            { status: 400 }
          );
        }

      case 'switch':
        if (!sessionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'sessionId 필드가 필요합니다.',
            },
            { status: 400 }
          );
        }

        const switched = chatManager.switchSession(sessionId);
        if (!switched) {
          return NextResponse.json(
            {
              success: false,
              error: `세션을 찾을 수 없습니다: ${sessionId}`,
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            currentSession: chatManager.getCurrentSession(),
          },
          message: '세션을 전환했습니다.',
        });

      case 'end':
        const ended = chatManager.endSession(sessionId);
        if (!ended) {
          return NextResponse.json(
            {
              success: false,
              error: sessionId
                ? `세션을 찾을 수 없습니다: ${sessionId}`
                : '활성 세션이 없습니다.',
            },
            { status: 404 }
          );
        }

        return NextResponse.json({
          success: true,
          data: {
            endedSessionId: sessionId || chatManager.getCurrentSession()?.id,
          },
          message: '세션을 종료했습니다.',
        });

      case 'export':
        if (!sessionId) {
          return NextResponse.json(
            {
              success: false,
              error: 'sessionId 필드가 필요합니다.',
            },
            { status: 400 }
          );
        }

        try {
          const format = body.format || 'json';
          const exportData = chatManager.exportConversation(sessionId, format);

          return NextResponse.json({
            success: true,
            data: {
              sessionId,
              format,
              exportData,
            },
            message: '대화 기록을 내보냈습니다.',
          });
        } catch (error) {
          return NextResponse.json(
            {
              success: false,
              error: error.message,
            },
            { status: 404 }
          );
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error: `지원하지 않는 액션: ${action}`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ AI 대화 API POST 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE: 세션 삭제
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'sessionId 파라미터가 필요합니다.',
        },
        { status: 400 }
      );
    }

    const chatManager = getChatManager();
    const session = chatManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: `세션을 찾을 수 없습니다: ${sessionId}`,
        },
        { status: 404 }
      );
    }

    // 세션 종료 (실제 삭제는 하지 않고 비활성화)
    const ended = chatManager.endSession(sessionId);

    return NextResponse.json({
      success: true,
      data: {
        deletedSessionId: sessionId,
        ended,
      },
      message: '세션을 삭제했습니다.',
    });
  } catch (error) {
    console.error('❌ AI 대화 API DELETE 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '서버 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}
