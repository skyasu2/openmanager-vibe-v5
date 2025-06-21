import { NextRequest, NextResponse } from 'next/server';

/**
 * 📊 데이터 생성기 API
 * 기본 캐싱 시스템 사용
 */

// 간단한 메모리 캐시
const dataCache = new Map<
  string,
  { data: any; timestamp: number; ttl: number }
>();

// 기본 Rate Limiting (메모리 기반)
const requestTracker = new Map<string, { count: number; resetTime: number }>();

function isRateLimited(
  ip: string,
  maxRequests: number = 20,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const key = `${ip}:data-generator`;
  const record = requestTracker.get(key);

  if (!record || now > record.resetTime) {
    requestTracker.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  if (record.count >= maxRequests) {
    return true;
  }

  record.count++;
  return false;
}

function getCachedData(key: string): any | null {
  const cached = dataCache.get(key);
  if (cached && Date.now() < cached.timestamp + cached.ttl) {
    return cached.data;
  }
  dataCache.delete(key);
  return null;
}

function setCachedData(key: string, data: any, ttlMs: number = 35000) {
  dataCache.set(key, {
    data,
    timestamp: Date.now(),
    ttl: ttlMs,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 기본 Rate Limiting
    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    if (isRateLimited(ip)) {
      return NextResponse.json(
        {
          error: 'Too Many Requests',
          message: '요청 제한을 초과했습니다. 잠시 후 다시 시도해주세요.',
        },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'metrics';
    const count = parseInt(searchParams.get('count') || '10');
    const cacheKey = `${type}-${count}`;

    // 캐시 확인 (30초 캐시)
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cachedData,
        timestamp: new Date().toISOString(),
      });
    }

    // 데이터 생성
    let generatedData;

    switch (type) {
      case 'metrics':
        generatedData = generateMetrics(count);
        break;
      case 'servers':
        generatedData = generateServers(count);
        break;
      case 'logs':
        generatedData = generateLogs(count);
        break;
      case 'traffic':
        generatedData = generateTraffic(count);
        break;
      default:
        generatedData = generateMetrics(count);
    }

    // 캐시 저장
    setCachedData(cacheKey, generatedData, 35000); // 35초 캐시

    return NextResponse.json({
      success: true,
      cached: false,
      data: generatedData,
      type,
      count: generatedData.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Data generator 오류:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Data generation failed',
        message: error.message,
      },
      { status: 500 }
    );
  }
}

function generateMetrics(count: number) {
  const metrics = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 60000).toISOString();
    metrics.push({
      timestamp,
      cpu: Math.round(20 + Math.random() * 60 + Math.sin(i / 10) * 10),
      memory: Math.round(30 + Math.random() * 50 + Math.sin(i / 8) * 15),
      disk: Math.round(40 + Math.random() * 30 + Math.sin(i / 12) * 5),
      networkIn: Math.round(1000 + Math.random() * 5000),
      networkOut: Math.round(2000 + Math.random() * 8000),
      responseTime: Math.round(100 + Math.random() * 400),
    });
  }

  return metrics;
}

function generateServers(count: number) {
  const servers = [];
  const statuses = ['running', 'stopped', 'maintenance', 'error'];
  const types = ['web', 'database', 'cache', 'worker'];

  for (let i = 0; i < count; i++) {
    servers.push({
      id: `server-${String(i + 1).padStart(3, '0')}`,
      name: `OpenManager-Server-${i + 1}`,
      type: types[Math.floor(Math.random() * types.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      cpu: Math.round(Math.random() * 100),
      memory: Math.round(Math.random() * 100),
      uptime: Math.round(Math.random() * 365 * 24 * 60 * 60), // seconds
      lastCheck: new Date().toISOString(),
    });
  }

  return servers;
}

function generateLogs(count: number) {
  const logs = [];
  const levels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const sources = [
    'web-server',
    'database',
    'cache',
    'worker',
    'load-balancer',
  ];
  const messages = [
    'Request processed successfully',
    'Database connection timeout',
    'Cache miss for key',
    'Memory usage high',
    'Request rate exceeded',
    'Service started',
    'Configuration updated',
    'Health check passed',
    'Error handling request',
    'Performance degraded',
  ];

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(
      Date.now() - Math.random() * 3600000
    ).toISOString();
    logs.push({
      timestamp,
      level: levels[Math.floor(Math.random() * levels.length)],
      source: sources[Math.floor(Math.random() * sources.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      details:
        Math.random() > 0.7
          ? { userId: Math.floor(Math.random() * 1000) }
          : null,
    });
  }

  return logs.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function generateTraffic(count: number) {
  const traffic = [];
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const timestamp = new Date(now - (count - i) * 300000).toISOString(); // 5분 간격
    traffic.push({
      timestamp,
      requests: Math.round(500 + Math.random() * 2000 + Math.sin(i / 6) * 500),
      bandwidth: Math.round(1000000 + Math.random() * 5000000), // bytes
      errors: Math.round(Math.random() * 50),
      avgResponseTime: Math.round(100 + Math.random() * 300),
    });
  }

  return traffic;
}
