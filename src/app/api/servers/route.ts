import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API /servers 요청 처리 시작');

    // 🎯 심각 → 경고 → 정상 순으로 명확하게 배열된 서버 데이터
    const sortedServers = [
      // 🚨 심각 상태 (critical) - CPU 높은 순
      {
        id: 'api-jp-040',
        name: 'api-jp-040',
        hostname: 'api-jp-040.openmanager.asia',
        status: 'critical',
        environment: 'production',
        location: 'Asia Pacific',
        ip: '192.168.1.40',
        cpu_usage: 95,
        memory_usage: 98,
        disk_usage: 85,
        uptime_hours: 0.5,
        uptime: '방금 전',
        last_updated: new Date().toISOString(),
        alerts: [
          {
            type: 'cpu_critical',
            severity: 'critical',
            message: 'CPU 사용률 위험: 95%',
            timestamp: new Date().toISOString(),
          },
        ],
        services: [
          { name: 'nginx', status: 'stopped', port: 80 },
          { name: 'nodejs', status: 'stopped', port: 3000 },
          { name: 'gunicorn', status: 'stopped', port: 8000 },
        ],
      },
      {
        id: 'api-sg-044',
        name: 'api-sg-044',
        hostname: 'api-sg-044.openmanager.asia',
        status: 'critical',
        environment: 'production',
        location: 'Singapore',
        ip: '192.168.1.44',
        cpu_usage: 88,
        memory_usage: 92,
        disk_usage: 78,
        uptime_hours: 0.2,
        uptime: '방금 전',
        last_updated: new Date().toISOString(),
        alerts: [
          {
            type: 'memory_critical',
            severity: 'critical',
            message: '메모리 사용률 위험: 92%',
            timestamp: new Date().toISOString(),
          },
        ],
        services: [
          { name: 'nodejs', status: 'stopped', port: 3000 },
          { name: 'nginx', status: 'stopped', port: 80 },
        ],
      },

      // ⚠️ 경고 상태 (warning) - CPU 높은 순
      {
        id: 'api-eu-045',
        name: 'api-eu-045',
        hostname: 'api-eu-045.openmanager.eu',
        status: 'warning',
        environment: 'production',
        location: 'EU West',
        ip: '192.168.1.45',
        cpu_usage: 78,
        memory_usage: 85,
        disk_usage: 68,
        uptime_hours: 200,
        uptime: '8일 8시간',
        last_updated: new Date().toISOString(),
        alerts: [
          {
            type: 'cpu_warning',
            severity: 'warning',
            message: 'CPU 사용률 높음: 78%',
            timestamp: new Date().toISOString(),
          },
        ],
        services: [
          { name: 'nodejs', status: 'stopped', port: 3000 },
          { name: 'nginx', status: 'running', port: 80 },
          { name: 'gunicorn', status: 'running', port: 8000 },
        ],
      },
      {
        id: 'api-sg-042',
        name: 'api-sg-042',
        hostname: 'api-sg-042.openmanager.asia',
        status: 'warning',
        environment: 'production',
        location: 'Singapore',
        ip: '192.168.1.42',
        cpu_usage: 72,
        memory_usage: 79,
        disk_usage: 58,
        uptime_hours: 198,
        uptime: '8일 6시간',
        last_updated: new Date().toISOString(),
        alerts: [
          {
            type: 'memory_warning',
            severity: 'warning',
            message: '메모리 사용률 높음: 79%',
            timestamp: new Date().toISOString(),
          },
        ],
        services: [
          { name: 'gunicorn', status: 'stopped', port: 8000 },
          { name: 'python', status: 'stopped', port: 3000 },
          { name: 'uwsgi', status: 'running', port: 8080 },
        ],
      },
      {
        id: 'api-us-039',
        name: 'api-us-039',
        hostname: 'api-us-039.openmanager.com',
        status: 'warning',
        environment: 'production',
        location: 'US East',
        ip: '192.168.1.39',
        cpu_usage: 68,
        memory_usage: 75,
        disk_usage: 45,
        uptime_hours: 1100,
        uptime: '45일 20시간',
        last_updated: new Date().toISOString(),
        alerts: [
          {
            type: 'cpu_warning',
            severity: 'warning',
            message: 'CPU 사용률 높음: 68%',
            timestamp: new Date().toISOString(),
          },
        ],
        services: [
          { name: 'uwsgi', status: 'stopped', port: 8080 },
          { name: 'gunicorn', status: 'running', port: 8000 },
        ],
      },

      // ✅ 정상 상태 (healthy) - CPU 높은 순
      {
        id: 'api-us-041',
        name: 'api-us-041',
        hostname: 'api-us-041.openmanager.com',
        status: 'healthy',
        environment: 'production',
        location: 'US East',
        ip: '192.168.1.41',
        cpu_usage: 59,
        memory_usage: 48,
        disk_usage: 30,
        uptime_hours: 533,
        uptime: '22일 5시간',
        last_updated: new Date().toISOString(),
        alerts: [],
        services: [
          { name: 'uwsgi', status: 'running', port: 8080 },
          { name: 'gunicorn', status: 'running', port: 8000 },
          { name: 'python', status: 'running', port: 3000 },
          { name: 'nodejs', status: 'running', port: 3001 },
        ],
      },
      {
        id: 'api-eu-043',
        name: 'api-eu-043',
        hostname: 'api-eu-043.openmanager.eu',
        status: 'healthy',
        environment: 'production',
        location: 'EU West',
        ip: '192.168.1.43',
        cpu_usage: 35,
        memory_usage: 36,
        disk_usage: 25,
        uptime_hours: 363,
        uptime: '15일 3시간',
        last_updated: new Date().toISOString(),
        alerts: [],
        services: [
          { name: 'gunicorn', status: 'running', port: 8000 },
          { name: 'python', status: 'running', port: 3000 },
          { name: 'nodejs', status: 'running', port: 3001 },
          { name: 'nginx', status: 'running', port: 80 },
        ],
      },
      {
        id: 'api-kr-046',
        name: 'api-kr-046',
        hostname: 'api-kr-046.openmanager.kr',
        status: 'healthy',
        environment: 'production',
        location: 'Seoul DC1',
        ip: '192.168.1.46',
        cpu_usage: 25,
        memory_usage: 32,
        disk_usage: 18,
        uptime_hours: 720,
        uptime: '30일',
        last_updated: new Date().toISOString(),
        alerts: [],
        services: [
          { name: 'nginx', status: 'running', port: 80 },
          { name: 'nodejs', status: 'running', port: 3000 },
          { name: 'pm2', status: 'running', port: 0 },
        ],
      },
    ];

    // 제한 개수 처리
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '30'); // 🔧 기본값을 30으로 변경
    const limitedServers = sortedServers.slice(0, limit);

    console.log(
      `✅ 정렬된 서버 데이터 반환: ${limitedServers.length}개 (전체: ${sortedServers.length}개)`
    );

    // 🔧 **전체 서버 기준** 상태별 분포 계산 (헤더 표시용)
    const fullStatusDistribution = {
      critical: sortedServers.filter(s => s.status === 'critical').length,
      warning: sortedServers.filter(s => s.status === 'warning').length,
      healthy: sortedServers.filter(s => s.status === 'healthy').length,
    };

    // 🔧 **표시용 서버 기준** 상태별 분포 계산 (리스트 표시용)
    const displayStatusDistribution = {
      critical: limitedServers.filter(s => s.status === 'critical').length,
      warning: limitedServers.filter(s => s.status === 'warning').length,
      healthy: limitedServers.filter(s => s.status === 'healthy').length,
    };

    console.log('📊 전체 서버 분포:', fullStatusDistribution);
    console.log('📊 표시용 서버 분포:', displayStatusDistribution);

    // 🔧 **UI 호환 통계 데이터 - 전체 서버 기준으로 수정**
    const serverStats = {
      total: sortedServers.length, // 🎯 전체 서버 개수 (30개)
      online: fullStatusDistribution.healthy, // healthy = online
      warning: fullStatusDistribution.warning,
      offline: fullStatusDistribution.critical, // critical = offline (UI 표시용)
    };

    console.log('📊 UI 호환 통계 (전체 기준):', serverStats);

    return NextResponse.json({
      success: true,
      servers: limitedServers,
      total: sortedServers.length, // 🎯 전체 서버 개수
      displayed: limitedServers.length, // 🔧 실제 표시되는 서버 개수
      stats: serverStats, // 🔧 UI에서 사용할 통계 데이터 (전체 기준)
      distribution: fullStatusDistribution, // 🔧 전체 서버 분포
      displayDistribution: displayStatusDistribution, // 🔧 표시용 서버 분포
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ API /servers 오류:', error);

    return NextResponse.json(
      {
        success: false,
        error: '서버 데이터 조회 실패',
        servers: [],
        total: 0,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
