/**
 * 📊 대시보드 설정 API
 *
 * 🔐 인증 필요: Bearer 토큰 또는 API 키 (GET 제외)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  withAdminAuth,
  type AuthenticatedRequest,
} from '@/lib/api/auth-middleware';

// 대시보드 설정 타입
interface DashboardConfig {
  layout: 'grid' | 'list' | 'masonry';
  theme: 'dark' | 'light' | 'auto';
  widgets: Array<{
    id: string;
    type: 'chart' | 'metric' | 'table' | 'status';
    position: { x: number; y: number; w: number; h: number };
    title: string;
    enabled: boolean;
    config: Record<string, any>;
  }>;
  refresh: {
    interval: number; // 초
    auto: boolean;
  };
  filters: {
    defaultEnvironment: string;
    defaultTimeRange: string;
    showOfflineServers: boolean;
  };
  notifications: {
    position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
    duration: number;
    sound: boolean;
  };
  refreshInterval: number;
  serverLimit: number;
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  features: {
    realTimeUpdates: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

// 기본 대시보드 설정
const DEFAULT_CONFIG: DashboardConfig = {
  layout: 'grid',
  theme: 'dark',
  widgets: [
    {
      id: 'cpu-chart',
      type: 'chart',
      position: { x: 0, y: 0, w: 6, h: 4 },
      title: 'CPU 사용률',
      enabled: true,
      config: { chartType: 'line', timeRange: '1h' },
    },
    {
      id: 'memory-chart',
      type: 'chart',
      position: { x: 6, y: 0, w: 6, h: 4 },
      title: '메모리 사용률',
      enabled: true,
      config: { chartType: 'area', timeRange: '1h' },
    },
    {
      id: 'server-status',
      type: 'status',
      position: { x: 0, y: 4, w: 4, h: 3 },
      title: '서버 상태',
      enabled: true,
      config: { showDetails: true },
    },
    {
      id: 'alerts-table',
      type: 'table',
      position: { x: 4, y: 4, w: 8, h: 3 },
      title: '최근 알림',
      enabled: true,
      config: { maxRows: 10, autoRefresh: true },
    },
    {
      id: 'network-metric',
      type: 'metric',
      position: { x: 0, y: 7, w: 3, h: 2 },
      title: '네트워크 I/O',
      enabled: true,
      config: { unit: 'MB/s', precision: 2 },
    },
    {
      id: 'disk-metric',
      type: 'metric',
      position: { x: 3, y: 7, w: 3, h: 2 },
      title: '디스크 I/O',
      enabled: true,
      config: { unit: 'MB/s', precision: 2 },
    },
  ],
  refresh: {
    interval: 45,
    auto: true,
  },
  filters: {
    defaultEnvironment: 'all',
    defaultTimeRange: '1h',
    showOfflineServers: false,
  },
  notifications: {
    position: 'top-right',
    duration: 5000,
    sound: false,
  },
  refreshInterval: 30000,
  serverLimit: 15,
  alertThresholds: {
    cpu: 80,
    memory: 85,
    disk: 90,
  },
  features: {
    realTimeUpdates: true,
    notifications: true,
    analytics: true,
  },
};

/**
 * 🔍 대시보드 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    if (section) {
      const sectionConfig = DEFAULT_CONFIG[section as keyof DashboardConfig];
      if (sectionConfig !== undefined) {
        return NextResponse.json({
          section,
          config: sectionConfig,
          timestamp: new Date().toISOString(),
        });
      } else {
        return NextResponse.json(
          { error: `지원하지 않는 섹션: ${section}` },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      config: DEFAULT_CONFIG,
      metadata: {
        version: '1.0.0',
        lastModified: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
      },
    });
  } catch (error) {
    console.error('대시보드 설정 조회 오류:', error);
    return NextResponse.json(
      { error: '대시보드 설정을 조회할 수 없습니다.' },
      { status: 500 }
    );
  }
}

/**
 * ⚙️ 대시보드 설정 업데이트 (인증 필요)
 */
async function updateDashboardConfig(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const { config, section } = body;

    if (section) {
      // 특정 섹션 업데이트
      console.log(
        `📊 Dashboard section ${section} updated by ${request.auth?.userId}`
      );
      return NextResponse.json({
        success: true,
        message: `${section} 설정이 업데이트되었습니다.`,
        section,
        config: config[section] || config,
        updatedBy: request.auth?.userId,
        timestamp: new Date().toISOString(),
      });
    } else {
      // 전체 설정 업데이트
      console.log(`📊 Dashboard config updated by ${request.auth?.userId}`);
      return NextResponse.json({
        success: true,
        message: '대시보드 설정이 업데이트되었습니다.',
        config: { ...DEFAULT_CONFIG, ...config },
        updatedBy: request.auth?.userId,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('대시보드 설정 업데이트 오류:', error);
    return NextResponse.json(
      { error: '대시보드 설정을 업데이트할 수 없습니다.' },
      { status: 500 }
    );
  }
}

export const POST = withAdminAuth(updateDashboardConfig);

/**
 * 🔄 대시보드 설정 초기화 (인증 필요)
 */
async function resetDashboardConfig(request: AuthenticatedRequest) {
  try {
    // 기본 설정으로 초기화
    const resetConfig = DEFAULT_CONFIG;

    console.log(`🔄 Dashboard config reset by ${request.auth?.userId}`);

    return NextResponse.json({
      success: true,
      data: resetConfig,
      message: '대시보드 설정이 기본값으로 초기화되었습니다.',
      resetBy: request.auth?.userId,
      resetAt: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: '대시보드 설정 초기화 실패',
        message: 'API 호출 중 오류가 발생했습니다.',
      },
      { status: 500 }
    );
  }
}

export const DELETE = withAdminAuth(resetDashboardConfig);

async function replaceDashboardConfig(request: AuthenticatedRequest) {
  try {
    const body = await request.json();

    console.log(`📊 Dashboard config replaced by ${request.auth?.userId}`);
    return NextResponse.json({
      success: true,
      message: '대시보드 설정이 완전히 교체되었습니다.',
      config: body,
      replacedBy: request.auth?.userId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('대시보드 설정 교체 오류:', error);
    return NextResponse.json(
      { error: '대시보드 설정을 교체할 수 없습니다.' },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(replaceDashboardConfig);
