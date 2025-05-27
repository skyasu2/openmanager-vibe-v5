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
  hostname: string;
  name: string;
  type: string;
  environment: string;
  location: string;
  provider: string;
  status: 'online' | 'warning' | 'offline';
  cpu: number;
  memory: number;
  disk: number;
  uptime: string;
  lastUpdate: Date;
  alerts: number;
  services: Array<{name: string; status: 'running' | 'stopped'; port: number}>;
  specs: {
    cpu_cores: number;
    memory_gb: number;
    disk_gb: number;
  };
  os: string;
  ip: string;
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
      hostname: `${nextServerId}.openmanager.local`,
      name: `OpenManager-${nextServerId}`,
      type: 'web-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'warning', // pending 상태 대신 warning 사용
      cpu: 0,
      memory: 0,
      disk: 0,
      uptime: '0d 0h 0m',
      lastUpdate: new Date(),
      alerts: 0,
      services: [],
      specs: {
        cpu_cores: 2 + (serverCount % 4),
        memory_gb: 4 + (serverCount % 8),
        disk_gb: 50 + (serverCount % 100)
      },
      os: 'Ubuntu 22.04 LTS',
      ip: `192.168.1.${100 + (serverCount + 1)}`
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
    
    const totalServers = 20; // 고정된 총 서버 수
    
    const newServer = {
      id: `server-${String(serverCount).padStart(3, '0')}`,
      hostname: `server-${String(serverCount).padStart(3, '0')}.openmanager.local`,
      name: body.name || `OpenManager-Server-${serverCount}`,
      type: body.type || 'web-server',
      environment: 'production',
      location: 'Seoul DC1',
      provider: 'onpremise',
      status: 'online' as const,
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // 30-70%
      disk: Math.floor(Math.random() * 20) + 10, // 10-30%
      uptime: '0d 0h 1m',
      lastUpdate: new Date(),
      alerts: Math.floor(Math.random() * 3), // 0-2 alerts
      services: [
        { name: 'nginx', status: 'running' as const, port: 80 },
        { name: 'node', status: 'running' as const, port: 3000 }
      ],
      specs: {
        cpu_cores: body.specs?.cpu || (2 + (serverCount % 4)),
        memory_gb: body.specs?.memory || (4 + (serverCount % 8)),
        disk_gb: body.specs?.storage || (50 + (serverCount % 100))
      },
      os: 'Ubuntu 22.04 LTS',
      ip: `192.168.1.${100 + serverCount}`
    };

    // 시뮬레이션: 생성 시간 지연
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));

    const isComplete = serverCount >= totalServers;
    const progress = Math.round((serverCount / totalServers) * 100);

    return NextResponse.json({
      success: true,
      server: newServer, // 훅에서 기대하는 필드명
      currentCount: serverCount,
      progress: progress,
      isComplete: isComplete,
      nextServerType: isComplete ? null : 'Database Server',
      message: isComplete ? '🎉 모든 서버 배포 완료!' : `서버 ${serverCount}/${totalServers} 배포 완료`,
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