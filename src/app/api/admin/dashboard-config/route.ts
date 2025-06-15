/**
 * 📊 대시보드 설정 API
 */

import { NextRequest, NextResponse } from 'next/server';

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
      config: { chartType: 'line', timeRange: '1h' }
    },
    {
      id: 'memory-chart',
      type: 'chart',
      position: { x: 6, y: 0, w: 6, h: 4 },
      title: '메모리 사용률',
      enabled: true,
      config: { chartType: 'area', timeRange: '1h' }
    },
    {
      id: 'server-status',
      type: 'status',
      position: { x: 0, y: 4, w: 4, h: 3 },
      title: '서버 상태',
      enabled: true,
      config: { showDetails: true }
    },
    {
      id: 'alerts-table',
      type: 'table',
      position: { x: 4, y: 4, w: 8, h: 3 },
      title: '최근 알림',
      enabled: true,
      config: { maxRows: 10, autoRefresh: true }
    },
    {
      id: 'network-metric',
      type: 'metric',
      position: { x: 0, y: 7, w: 3, h: 2 },
      title: '네트워크 I/O',
      enabled: true,
      config: { unit: 'MB/s', precision: 2 }
    },
    {
      id: 'disk-metric',
      type: 'metric',
      position: { x: 3, y: 7, w: 3, h: 2 },
      title: '디스크 I/O',
      enabled: true,
      config: { unit: 'MB/s', precision: 2 }
    }
  ],
  refresh: {
    interval: 45,
    auto: true
  },
  filters: {
    defaultEnvironment: 'all',
    defaultTimeRange: '1h',
    showOfflineServers: false
  },
  notifications: {
    position: 'top-right',
    duration: 5000,
    sound: false
  }
};

/**
 * 🔍 대시보드 설정 조회
 */
export async function GET(request: NextRequest) {
  try {
    const config = DEFAULT_CONFIG;
    
    return NextResponse.json({
      success: true,
      data: config,
      message: '대시보드 설정을 성공적으로 조회했습니다.',
      stats: {
        totalWidgets: config.widgets.length,
        enabledWidgets: config.widgets.filter(w => w.enabled).length,
        layoutType: config.layout,
        lastModified: new Date(Date.now() - 3600000).toISOString()
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '대시보드 설정 조회 실패',
      message: 'API 호출 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * ⚙️ 대시보드 설정 업데이트
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 설정 병합
    const updatedConfig = {
      ...DEFAULT_CONFIG,
      ...body
    };
    
    // 유효성 검사
    if (updatedConfig.refresh.interval < 5) {
      return NextResponse.json({
        success: false,
        error: '새로고침 간격은 최소 5초여야 합니다.'
      }, { status: 400 });
    }
    
    if (updatedConfig.widgets.length > 20) {
      return NextResponse.json({
        success: false,
        error: '위젯은 최대 20개까지 추가할 수 있습니다.'
      }, { status: 400 });
    }
    
    // 실제로는 데이터베이스에 저장
    console.log('🔧 대시보드 설정 업데이트:', updatedConfig);
    
    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: '대시보드 설정이 성공적으로 업데이트되었습니다.',
      appliedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '대시보드 설정 업데이트 실패',
      message: 'API 호출 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
}

/**
 * 🔄 대시보드 설정 초기화
 */
export async function DELETE(request: NextRequest) {
  try {
    // 기본 설정으로 초기화
    const resetConfig = DEFAULT_CONFIG;
    
    console.log('🔄 대시보드 설정 초기화');
    
    return NextResponse.json({
      success: true,
      data: resetConfig,
      message: '대시보드 설정이 기본값으로 초기화되었습니다.',
      resetAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: '대시보드 설정 초기화 실패',
      message: 'API 호출 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 