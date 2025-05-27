import { NextRequest, NextResponse } from 'next/server';
import { rateLimiters, withRateLimit } from '@/lib/rate-limiter';

/**
 * 🖥️ Sequential Server Generation API
 * GET: 다음 서버 정보 조회 (Rate Limited: 1분에 20회)
 * POST: 서버 생성 요청 (Rate Limited: 1분에 20회)
 */

// 간단한 서버 상태 관리 (실제로는 데이터베이스 사용)
let serverCount = 0;
let lastGeneratedTime = Date.now();

interface ServerInfo {
  id: string;
  name: string;
  type: string;
  status: string;
  createdAt: string;
  specs: {
    cpu: number;
    memory: number;
    storage: number;
  };
}

/**
 * GET /api/servers/next
 * 다음 생성될 서버 정보 조회
 */
async function handleGET(request: NextRequest) {
  try {
    const nextServerId = `server-${String(serverCount + 1).padStart(3, '0')}`;
    
    const nextServer: ServerInfo = {
      id: nextServerId,
      name: `OpenManager-${nextServerId}`,
      type: 'web-server',
      status: 'pending',
      createdAt: new Date().toISOString(),
      specs: {
        cpu: 2 + (serverCount % 4),
        memory: 4 + (serverCount % 8),
        storage: 50 + (serverCount % 100)
      }
    };

    return NextResponse.json({
      success: true,
      data: nextServer,
      metadata: {
        totalServers: serverCount,
        lastGeneratedTime,
        nextId: serverCount + 1
      }
    });

  } catch (error) {
    console.error('GET /api/servers/next 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get next server info',
      message: '다음 서버 정보 조회 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * POST /api/servers/next  
 * 서버 생성 요청
 */
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // 리셋 요청 처리
    if (body.reset === true) {
      serverCount = 0;
      lastGeneratedTime = Date.now();
      
      return NextResponse.json({
        success: true,
        message: '서버 카운터가 리셋되었습니다.',
        data: { serverCount: 0, resetTime: lastGeneratedTime }
      });
    }
    
    // 새 서버 생성
    serverCount++;
    lastGeneratedTime = Date.now();
    
    const newServer: ServerInfo = {
      id: `server-${String(serverCount).padStart(3, '0')}`,
      name: body.name || `OpenManager-Server-${serverCount}`,
      type: body.type || 'web-server',
      status: 'creating',
      createdAt: new Date().toISOString(),
      specs: {
        cpu: body.specs?.cpu || (2 + (serverCount % 4)),
        memory: body.specs?.memory || (4 + (serverCount % 8)),
        storage: body.specs?.storage || (50 + (serverCount % 100))
      }
    };

    // 시뮬레이션: 생성 시간 지연
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    return NextResponse.json({
      success: true,
      data: {
        ...newServer,
        status: 'running' // 생성 완료
      },
      metadata: {
        totalServers: serverCount,
        creationTime: Date.now() - lastGeneratedTime,
        previousId: serverCount - 1
      }
    });

  } catch (error) {
    console.error('POST /api/servers/next 오류:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to create server',
      message: '서버 생성 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}

// Rate Limited exports
export const GET = withRateLimit(rateLimiters.serversNext, handleGET);
export const POST = withRateLimit(rateLimiters.serversNext, handlePOST); 