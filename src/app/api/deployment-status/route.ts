import { NextResponse } from 'next/server';

interface DeploymentStatus {
  status: 'healthy' | 'degraded' | 'maintenance' | 'incident';
  timestamp: string;
  deployment: {
    environment: string;
    version: string;
    buildTime: string;
    lastDeploy: string;
  };
  vercelErrors: {
    detected: string[];
    preventionMeasures: string[];
  };
  performance: {
    responseTime: number;
    uptime: string;
    errorRate: number;
  };
}

// Vercel 오류 감지 시스템
function detectVercelErrors(): string[] {
  const detectedErrors: string[] = [];
  
  // 메모리 사용량 체크
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const memoryUsagePercent = (usage.heapUsed / usage.heapTotal) * 100;
    
    if (memoryUsagePercent > 85) {
      detectedErrors.push('HIGH_MEMORY_USAGE');
    }
  }
  
  // 환경 변수 체크
  if (!process.env.NODE_ENV) {
    detectedErrors.push('MISSING_NODE_ENV');
  }
  
  return detectedErrors;
}

// 예방 조치 제안
function getPreventionMeasures(errors: string[]): string[] {
  const measures: string[] = [];
  
  if (errors.includes('HIGH_MEMORY_USAGE')) {
    measures.push('Optimize memory usage in functions');
    measures.push('Implement garbage collection strategies');
  }
  
  if (errors.includes('MISSING_NODE_ENV')) {
    measures.push('Set NODE_ENV environment variable');
  }
  
  // 기본 예방 조치
  measures.push('Monitor function execution time');
  measures.push('Implement proper error boundaries');
  measures.push('Use middleware timeout protection');
  
  return measures;
}

export async function GET() {
  const startTime = Date.now();
  
  try {
    // Vercel 오류 감지
    const detectedErrors = detectVercelErrors();
    const preventionMeasures = getPreventionMeasures(detectedErrors);
    
    // 성능 메트릭 계산
    const responseTime = Date.now() - startTime;
    
    // 배포 상태 결정
    let status: 'healthy' | 'degraded' | 'maintenance' | 'incident' = 'healthy';
    
    if (detectedErrors.length > 0) {
      status = detectedErrors.length > 2 ? 'incident' : 'degraded';
    }
    
    const response: DeploymentStatus = {
      status,
      timestamp: new Date().toISOString(),
      deployment: {
        environment: process.env.NODE_ENV || 'unknown',
        version: '1.0.0',
        buildTime: process.env.BUILD_TIME || 'unknown',
        lastDeploy: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'unknown'
      },
      vercelErrors: {
        detected: detectedErrors,
        preventionMeasures
      },
      performance: {
        responseTime,
        uptime: typeof process !== 'undefined' && process.uptime 
          ? `${Math.floor(process.uptime())}s` 
          : 'N/A',
        errorRate: detectedErrors.length / 10 // 예시 계산
      }
    };
    
    // 페이로드 크기 검증 (1MB 이하)
    const responseSize = JSON.stringify(response).length;
    if (responseSize > 1024 * 1024) {
      console.warn(`[Deployment Status] Large response: ${responseSize} bytes`);
    }
    
    return NextResponse.json(response, {
      status: status === 'incident' ? 503 : 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Deployment-Status': status,
        'X-Response-Time': responseTime.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
    
  } catch (error) {
    console.error('[Deployment Status] Error:', error);
    
    return NextResponse.json({
      status: 'incident',
      timestamp: new Date().toISOString(),
      error: 'Internal server error',
      message: 'Failed to retrieve deployment status'
    }, {
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
        'X-Deployment-Status': 'incident',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }
}

// OPTIONS 요청 처리 (CORS preflight)
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    }
  });
} 