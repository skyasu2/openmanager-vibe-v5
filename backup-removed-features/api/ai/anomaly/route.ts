import { detectAnomalies, MetricPoint } from '@/lib/ml/lightweight-ml-engine';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { history, threshold = 2.5 } = await req.json();
    if (!Array.isArray(history) || history.length === 0) {
      return NextResponse.json(
        { error: 'history is required' },
        { status: 400 }
      );
    }
    const anomalies = detectAnomalies(history as MetricPoint[], threshold);
    return NextResponse.json({ anomalies, count: anomalies.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * 🚨 실시간 이상징후 모니터링 API
 *
 * 시스템의 실시간 이상징후를 감지하고 알림을 제공합니다.
 */
export async function GET(request: NextRequest) {
  try {
    console.log('🚨 실시간 이상징후 모니터링 API 호출');

    // 실제 서버 데이터 가져오기
    const serversResponse = await fetch(
      `${request.nextUrl.origin}/api/servers?limit=50`
    );
    let servers = [];

    if (serversResponse.ok) {
      const data = await serversResponse.json();
      servers = data.servers || [];
    }

    // 이상징후 분석
    const anomalies = analyzeAnomalies(servers);

    // 최근 알림 생성
    const recentNotifications = generateRecentNotifications(anomalies);

    const response = {
      success: true,
      status: 'monitoring',
      timestamp: new Date().toISOString(),
      anomalies: anomalies,
      recentNotifications: recentNotifications,
      systemStatus: {
        monitoring: true,
        sensitivity: 'medium',
        lastUpdate: new Date().toISOString(),
        totalServers: servers.length,
        healthyServers: servers.filter((s: any) => s.status === 'healthy')
          .length,
        warningServers: servers.filter((s: any) => s.status === 'warning')
          .length,
        criticalServers: servers.filter((s: any) => s.status === 'critical')
          .length,
      },
      channels: {
        browser: { enabled: true, status: 'connected' },
        email: { enabled: false, status: 'disabled' },
        slack: { enabled: false, status: 'disabled' },
      },
      settings: {
        criticalOnly: false,
        quietHours: { enabled: false },
      },
    };

    console.log('✅ 이상징후 모니터링 응답:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ 이상징후 모니터링 API 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '이상징후 모니터링 서비스 오류',
        fallback: {
          message:
            '이상징후 모니터링 서비스에 연결할 수 없습니다. 시스템 상태는 정상으로 보입니다.',
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 🔍 이상징후 분석 함수
 */
function analyzeAnomalies(servers: any[]) {
  const anomalies: Array<{
    type: string;
    severity: string;
    count: number;
    message: string;
    servers: string[];
  }> = [];

  // CPU 사용률 이상
  const highCpuServers = servers.filter((s: any) => s.metrics?.cpu > 85);
  if (highCpuServers.length > 0) {
    anomalies.push({
      type: 'high_cpu',
      severity: 'warning',
      count: highCpuServers.length,
      message: `${highCpuServers.length}개 서버에서 높은 CPU 사용률 감지`,
      servers: highCpuServers.map((s: any) => s.name),
    });
  }

  // 메모리 사용률 이상
  const highMemoryServers = servers.filter((s: any) => s.metrics?.memory > 90);
  if (highMemoryServers.length > 0) {
    anomalies.push({
      type: 'high_memory',
      severity: 'critical',
      count: highMemoryServers.length,
      message: `${highMemoryServers.length}개 서버에서 높은 메모리 사용률 감지`,
      servers: highMemoryServers.map((s: any) => s.name),
    });
  }

  // 디스크 사용률 이상
  const highDiskServers = servers.filter((s: any) => s.metrics?.disk > 95);
  if (highDiskServers.length > 0) {
    anomalies.push({
      type: 'high_disk',
      severity: 'critical',
      count: highDiskServers.length,
      message: `${highDiskServers.length}개 서버에서 높은 디스크 사용률 감지`,
      servers: highDiskServers.map((s: any) => s.name),
    });
  }

  // 오프라인 서버
  const offlineServers = servers.filter((s: any) => s.status === 'critical');
  if (offlineServers.length > 0) {
    anomalies.push({
      type: 'server_offline',
      severity: 'critical',
      count: offlineServers.length,
      message: `${offlineServers.length}개 서버가 오프라인 상태`,
      servers: offlineServers.map((s: any) => s.name),
    });
  }

  return anomalies;
}

/**
 * 📢 최근 알림 생성 함수
 */
function generateRecentNotifications(anomalies: any[]) {
  const notifications: Array<{
    id: string;
    type: string;
    severity: string;
    message: string;
    timestamp: string;
    details: any;
  }> = [];

  for (const anomaly of anomalies) {
    notifications.push({
      id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'anomaly',
      severity: anomaly.severity,
      message: anomaly.message,
      timestamp: new Date().toISOString(),
      details: {
        type: anomaly.type,
        count: anomaly.count,
        servers: anomaly.servers,
      },
    });
  }

  // 기본 알림이 없으면 정상 상태 알림 추가
  if (notifications.length === 0) {
    notifications.push({
      id: `normal_${Date.now()}`,
      type: 'info',
      severity: 'info',
      message: '모든 시스템이 정상 상태입니다',
      timestamp: new Date().toISOString(),
      details: {
        type: 'system_normal',
        message: '현재 감지된 이상징후가 없습니다',
      },
    });
  }

  return notifications.slice(0, 10); // 최대 10개까지만 반환
}
