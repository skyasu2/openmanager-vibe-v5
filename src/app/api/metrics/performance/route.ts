import { NextRequest, NextResponse } from 'next/server';

/**
 * 📊 실시간 성능 메트릭 API
 * GET /api/metrics/performance
 * 
 * 시스템의 실시간 성능 데이터를 제공합니다
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || '1h'; // 1h, 6h, 24h, 7d
    const metric = searchParams.get('metric') || 'all'; // cpu, memory, disk, network, all

    const performanceData = await collectPerformanceMetrics(timeRange, metric);

    return NextResponse.json({
      success: true,
      timeRange,
      metric,
      data: performanceData,
      timestamp: new Date().toISOString(),
      metadata: {
        dataPoints: performanceData.length,
        resolution: getResolution(timeRange),
        nextUpdate: new Date(Date.now() + 30000).toISOString() // 30초 후 업데이트
      }
    });

  } catch (error) {
    console.error('❌ 성능 메트릭 조회 오류:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 성능 메트릭 수집
 */
async function collectPerformanceMetrics(timeRange: string, metric: string) {
  const now = Date.now();
  const ranges = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000
  };

  const duration = ranges[timeRange as keyof typeof ranges] || ranges['1h'];
  const startTime = now - duration;
  const dataPoints = getDataPointCount(timeRange);
  const interval = duration / dataPoints;

  const metrics = [];

  for (let i = 0; i < dataPoints; i++) {
    const timestamp = startTime + (i * interval);
    const dataPoint = generateMetricDataPoint(timestamp, metric);
    metrics.push(dataPoint);
  }

  return metrics;
}

/**
 * 메트릭 데이터 포인트 생성
 */
function generateMetricDataPoint(timestamp: number, metric: string) {
  const baseData = {
    timestamp: new Date(timestamp).toISOString(),
    unixTimestamp: timestamp
  };

  // 실제 프로덕션에서는 Redis나 데이터베이스에서 실제 메트릭을 가져옴
  if (metric === 'all' || metric === 'cpu') {
    Object.assign(baseData, {
      cpu: {
        usage: Math.random() * 30 + 20, // 20-50%
        cores: 4,
        loadAverage: [
          Math.random() * 2 + 0.5,
          Math.random() * 2 + 0.8,
          Math.random() * 2 + 1.0
        ]
      }
    });
  }

  if (metric === 'all' || metric === 'memory') {
    Object.assign(baseData, {
      memory: {
        used: Math.random() * 40 + 30, // 30-70%
        total: 8192, // 8GB
        available: Math.random() * 3000 + 2000,
        buffers: Math.random() * 500 + 200,
        cached: Math.random() * 1000 + 500
      }
    });
  }

  if (metric === 'all' || metric === 'disk') {
    Object.assign(baseData, {
      disk: {
        usage: Math.random() * 20 + 10, // 10-30%
        total: 100 * 1024, // 100GB
        available: Math.random() * 70000 + 70000,
        readOps: Math.random() * 1000 + 500,
        writeOps: Math.random() * 500 + 200,
        readBytes: Math.random() * 10000000 + 5000000,
        writeBytes: Math.random() * 5000000 + 2000000
      }
    });
  }

  if (metric === 'all' || metric === 'network') {
    Object.assign(baseData, {
      network: {
        bytesIn: Math.random() * 1000000 + 500000,
        bytesOut: Math.random() * 500000 + 200000,
        packetsIn: Math.random() * 1000 + 500,
        packetsOut: Math.random() * 800 + 300,
        errors: Math.floor(Math.random() * 5),
        dropped: Math.floor(Math.random() * 3)
      }
    });
  }

  // 시스템 전반 메트릭
  if (metric === 'all') {
    Object.assign(baseData, {
      system: {
        uptime: Math.random() * 1000000 + 500000,
        processes: Math.floor(Math.random() * 200 + 100),
        threads: Math.floor(Math.random() * 1000 + 500),
        handles: Math.floor(Math.random() * 10000 + 5000),
        temperature: Math.random() * 20 + 40 // 40-60°C
      },
      application: {
        responseTime: Math.random() * 200 + 50, // 50-250ms
        throughput: Math.random() * 1000 + 500, // 500-1500 req/min
        errorRate: Math.random() * 2, // 0-2%
        activeConnections: Math.floor(Math.random() * 100 + 50)
      }
    });
  }

  return baseData;
}

/**
 * 시간 범위별 데이터 포인트 수
 */
function getDataPointCount(timeRange: string): number {
  const counts = {
    '1h': 60,   // 1분마다
    '6h': 72,   // 5분마다
    '24h': 144, // 10분마다
    '7d': 168   // 1시간마다
  };

  return counts[timeRange as keyof typeof counts] || 60;
}

/**
 * 시간 범위별 해상도
 */
function getResolution(timeRange: string): string {
  const resolutions = {
    '1h': '1분',
    '6h': '5분',
    '24h': '10분',
    '7d': '1시간'
  };

  return resolutions[timeRange as keyof typeof resolutions] || '1분';
}

/**
 * OPTIONS - CORS 지원
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 