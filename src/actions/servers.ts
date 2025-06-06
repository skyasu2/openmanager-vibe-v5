'use server';

import { revalidatePath } from 'next/cache';

/**
 * 🚀 Server Management Server Actions
 * 서버 관리를 위한 Server Actions
 */

interface Server {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'warning' | 'error';
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  region: string;
}

// 서버 목록 가져오기 (시뮬레이션 엔진 통합)
export async function getServers() {
  try {
    // 실제 시뮬레이션 엔진에서 서버 데이터 가져오기
    const response = await fetch('/api/servers');
    if (!response.ok) {
      throw new Error('Failed to fetch servers');
    }

    const data = await response.json();
    return {
      success: true,
      data: data.servers || [],
    };
  } catch (error) {
    console.error('Get servers error:', error);

    // 폴백: 최소한의 Mock 데이터
    const fallbackServers: Server[] = [
      {
        id: 'fallback-web-01',
        name: 'Web Server 01',
        status: 'online',
        cpu: 45,
        memory: 67,
        disk: 23,
        network: 156,
        region: 'us-east-1',
      },
    ];

    return {
      success: true,
      data: fallbackServers,
    };
  }
}

// 특정 서버 가져오기
export async function getServerById(id: string) {
  try {
    const servers = await getServers();
    if (!servers.success || !servers.data) {
      throw new Error('Failed to get servers');
    }

    const server = servers.data.find((s: Server) => s.id === id);
    if (!server) {
      return {
        success: false,
        error: 'Server not found',
      };
    }

    // 상세 정보 추가
    const serverDetails = {
      ...server,
      details: {
        uptime: Math.floor(Math.random() * 86400),
        processes: Math.floor(Math.random() * 100),
        connections: Math.floor(Math.random() * 1000),
        lastUpdate: new Date().toISOString(),
      },
    };

    return {
      success: true,
      data: serverDetails,
    };
  } catch (error) {
    console.error('Get server by ID error:', error);
    return {
      success: false,
      error: 'Failed to get server details',
    };
  }
}

// 서버 상태 업데이트
export async function updateServerStatus(id: string, status: Server['status']) {
  try {
    // 실제로는 데이터베이스 업데이트 로직이 들어감
    // 여기서는 시뮬레이션

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/servers/${id}`);

    return {
      success: true,
      message: `Server ${id} status updated to ${status}`,
    };
  } catch (error) {
    console.error('Update server status error:', error);
    return {
      success: false,
      error: 'Failed to update server status',
    };
  }
}

// 서버 재시작
export async function restartServer(id: string) {
  try {
    // 서버 재시작 로직 시뮬레이션
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 캐시 무효화
    revalidatePath('/dashboard');
    revalidatePath(`/servers/${id}`);

    return {
      success: true,
      message: `Server ${id} restarted successfully`,
    };
  } catch (error) {
    console.error('Restart server error:', error);
    return {
      success: false,
      error: 'Failed to restart server',
    };
  }
}

// 서버 메트릭 새로고침
export async function refreshServerMetrics() {
  try {
    // 모든 서버 메트릭 갱신
    revalidatePath('/dashboard');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'Server metrics refreshed',
    };
  } catch (error) {
    console.error('Refresh server metrics error:', error);
    return {
      success: false,
      error: 'Failed to refresh server metrics',
    };
  }
}
