/**
 * 🔄 Realtime Connection API v1.0
 *
 * OpenManager v5.21.0 - 실시간 연결 관리
 * GET: 연결 상태 조회
 * POST: 새 연결 등록
 * PUT: 연결 그룹 관리
 * DELETE: 연결 해제
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getRealTimeHub } from '@/core/realtime/RealTimeHub';
import debug from '@/utils/debug';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * 📊 연결 상태 및 통계 조회
 */
export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');
    const groupName = searchParams.get('group');
    const showStats = searchParams.get('stats') === 'true';

    const hub = getRealTimeHub();

    // 통계 조회
    if (showStats) {
      const statistics = hub.getStats();
      return NextResponse.json({
        success: true,
        data: {
          type: 'stats',
          stats: statistics,
          timestamp: Date.now(),
        },
      });
    }

    // 특정 연결 조회
    if (connectionId) {
      const connection = hub.getConnection(connectionId);
      if (!connection) {
        return NextResponse.json(
          {
            success: false,
            error: '연결을 찾을 수 없습니다',
          },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          type: 'connection',
          connection: {
            ...connection,
            groups: Array.from(connection.groups),
            socket: connection.socket ? 'connected' : 'disconnected',
          },
        },
      });
    }

    // 그룹 연결 목록 조회
    if (groupName) {
      const connections = hub.getGroup(groupName);
      return NextResponse.json({
        success: true,
        data: {
          type: 'group',
          groupName,
          connections,
          count: connections.length,
        },
      });
    }

    // 전체 상태 조회
    const hubStats = hub.getStats();
    return NextResponse.json({
      success: true,
      data: {
        type: 'overview',
        stats: hubStats,
        timestamp: Date.now(),
      },
    });
  } catch (error) {
    debug.error('❌ 실시간 연결 조회 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '연결 상태 조회 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * 🔗 새 연결 등록
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, userId, groups = ['default'], metadata = {} } = body;

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId가 필요합니다',
        },
        { status: 400 }
      );
    }

    const hub = getRealTimeHub();

    // 연결 등록
    const connection = hub.registerConnection(connectionId, null, {
      ...metadata,
      userId,
      registeredAt: Date.now(),
      userAgent: request.headers.get('user-agent'),
      ip:
        request.headers.get('x-forwarded-for') ||
        request.headers.get('x-real-ip'),
    });

    // 그룹에 추가
    groups.forEach((group: string) => {
      if (group !== 'default') {
        hub.addToGroup(group, connectionId);
      }
    });

    // 연결 알림 브로드캐스트
    hub.broadcast({
      type: 'system_event',
      data: {
        event: 'connection_registered',
        connectionId,
        userId,
        groups: Array.from(connection.groups),
      },
      target: ['admin'],
    });

    return NextResponse.json({
      success: true,
      data: {
        connectionId,
        connection: {
          ...connection,
          groups: Array.from(connection.groups),
          socket: 'registered',
        },
        message: '연결이 성공적으로 등록되었습니다',
      },
    });
  } catch (error) {
    debug.error('❌ 실시간 연결 등록 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '연결 등록 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * 👥 연결 그룹 관리
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { connectionId, action, groupName } = body;

    if (!connectionId || !action || !groupName) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId, action, groupName이 필요합니다',
        },
        { status: 400 }
      );
    }

    const hub = getRealTimeHub();
    const connection = hub.getConnection(connectionId);

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: '연결을 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    let result = false;
    let message = '';

    switch (action) {
      case 'join':
        result = hub.addToGroup(groupName, connectionId);
        message = result
          ? `그룹 '${groupName}'에 참가했습니다`
          : '그룹 참가에 실패했습니다';
        break;

      case 'leave':
        result = hub.removeFromGroup(groupName, connectionId);
        message = result
          ? `그룹 '${groupName}'에서 나갔습니다`
          : '그룹 탈퇴에 실패했습니다';
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: '유효하지 않은 액션입니다 (join, leave 가능)',
          },
          { status: 400 }
        );
    }

    if (result) {
      // 그룹 변경 알림
      hub.broadcast({
        type: 'system_event',
        data: {
          event: 'group_changed',
          connectionId,
          action,
          groupName,
          currentGroups: Array.from(connection.groups),
        },
        target: [groupName, 'admin'],
      });
    }

    return NextResponse.json({
      success: result,
      data: {
        connectionId,
        action,
        groupName,
        currentGroups: Array.from(connection.groups),
        message,
      },
    });
  } catch (error) {
    debug.error('❌ 그룹 관리 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '그룹 관리 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}

/**
 * 🚪 연결 해제
 */
export function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const connectionId = searchParams.get('connectionId');

    if (!connectionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'connectionId가 필요합니다',
        },
        { status: 400 }
      );
    }

    const hub = getRealTimeHub();
    const connection = hub.getConnection(connectionId);

    if (!connection) {
      return NextResponse.json(
        {
          success: false,
          error: '연결을 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    const groups = Array.from(connection.groups);
    const result = hub.disconnectConnection(connectionId);

    if (result) {
      // 연결 해제 알림
      hub.broadcast({
        type: 'system_event',
        data: {
          event: 'connection_disconnected',
          connectionId,
          previousGroups: groups,
        },
        target: ['admin'],
      });
    }

    return NextResponse.json({
      success: result,
      data: {
        connectionId,
        message: result
          ? '연결이 성공적으로 해제되었습니다'
          : '연결 해제에 실패했습니다',
      },
    });
  } catch (error) {
    debug.error('❌ 연결 해제 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: '연결 해제 중 오류가 발생했습니다',
      },
      { status: 500 }
    );
  }
}
