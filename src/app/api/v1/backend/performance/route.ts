/**
 * 🚀 백엔드 성능 모니터링 API
 * 
 * 실시간 성능 지표, 메모리 상태, Python 브릿지 상태 모니터링
 */
import { NextRequest, NextResponse } from 'next/server';
import { memoryManager } from '@/utils/MemoryManager';
import { PythonMLBridge } from '@/services/python-bridge/ml-bridge';

// Python 브릿지 인스턴스 (싱글톤)
let pythonBridge: PythonMLBridge | null = null;
function getPythonBridge(): PythonMLBridge {
  if (!pythonBridge) {
    pythonBridge = new PythonMLBridge(process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com');
  }
  return pythonBridge;
}

/**
 * 📊 GET - 전체 백엔드 성능 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric');
    const action = searchParams.get('action');

    // 특정 액션 처리
    if (action) {
      return handlePerformanceAction(action);
    }

    // 특정 메트릭 조회
    if (metric) {
      return getSpecificMetric(metric);
    }

    // 전체 성능 상태 조회
    const performanceData = await getOverallPerformance();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      performance: performanceData
    });

  } catch (error: any) {
    console.error('❌ 성능 모니터링 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 🔧 POST - 성능 최적화 액션 실행
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, parameters } = body;

    console.log(`🔧 성능 최적화 액션 실행: ${action}`);

    let result;
    switch (action) {
      case 'cleanup_memory':
        result = await performMemoryCleanup();
        break;
        
      case 'reset_python_bridge':
        result = await resetPythonBridge();
        break;
        
      case 'optimize_cache':
        result = await optimizeCache(parameters);
        break;
        
      case 'emergency_cleanup':
        result = await performEmergencyCleanup();
        break;
        
      case 'warmup_python':
        result = await warmupPython();
        break;
        
      default:
        throw new Error(`지원하지 않는 액션: ${action}`);
    }

    return NextResponse.json({
      success: true,
      action,
      result,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('❌ 성능 최적화 실행 오류:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

/**
 * 📊 전체 성능 데이터 수집
 */
async function getOverallPerformance() {
  const startTime = Date.now();
  
  // 시스템 메모리 정보
  const memoryUsage = process.memoryUsage();
  const memoryStatus = memoryManager.getStatus();
  
  // Python 브릿지 상태
  const bridge = getPythonBridge();
  const bridgeMetrics = bridge.getMetrics();
  const pythonHealth = await bridge.healthCheck();
  
  // CPU 정보 (Node.js cpuUsage)
  const cpuUsage = process.cpuUsage();
  
  // 업타임 및 버전 정보
  const uptime = process.uptime();
  const nodeVersion = process.version;
  
  const collectTime = Date.now() - startTime;

  return {
    system: {
      uptime: Math.floor(uptime),
      nodeVersion,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid
    },
    memory: {
      current: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        arrayBuffers: Math.round(memoryUsage.arrayBuffers / 1024 / 1024)
      },
      monitoring: memoryStatus.monitor,
      pools: memoryStatus.pools
    },
    pythonBridge: {
      health: pythonHealth,
      metrics: bridgeMetrics,
      status: pythonHealth ? 'healthy' : 'unhealthy'
    },
    cpu: {
      user: Math.round(cpuUsage.user / 1000), // 마이크로초 → 밀리초
      system: Math.round(cpuUsage.system / 1000)
    },
    performance: {
      dataCollectionTime: collectTime,
      responseTime: Date.now()
    }
  };
}

/**
 * 🎯 특정 메트릭 조회
 */
async function getSpecificMetric(metric: string) {
  const startTime = Date.now();
  
  switch (metric) {
    case 'memory':
      return NextResponse.json({
        metric: 'memory',
        data: memoryManager.getStatus(),
        collectionTime: Date.now() - startTime
      });
      
    case 'python':
      const bridge = getPythonBridge();
      const health = await bridge.healthCheck();
      return NextResponse.json({
        metric: 'python',
        data: {
          health,
          metrics: bridge.getMetrics(),
          url: process.env.FASTAPI_BASE_URL || 'https://openmanager-ai-engine.onrender.com'
        },
        collectionTime: Date.now() - startTime
      });
      
    case 'cpu':
      const cpuUsage = process.cpuUsage();
      return NextResponse.json({
        metric: 'cpu',
        data: {
          user: Math.round(cpuUsage.user / 1000),
          system: Math.round(cpuUsage.system / 1000),
          uptime: Math.floor(process.uptime())
        },
        collectionTime: Date.now() - startTime
      });
      
    default:
      throw new Error(`지원하지 않는 메트릭: ${metric}`);
  }
}

/**
 * ⚡ 성능 액션 처리
 */
async function handlePerformanceAction(action: string) {
  switch (action) {
    case 'health':
      const health = await getHealthStatus();
      return NextResponse.json({
        success: true,
        health,
        timestamp: new Date().toISOString()
      });
      
    case 'memory_stats':
      const memStats = memoryManager.getStatus();
      return NextResponse.json({
        success: true,
        memory: memStats,
        timestamp: new Date().toISOString()
      });
      
    case 'python_status':
      const bridge = getPythonBridge();
      const pythonHealth = await bridge.healthCheck();
      const pythonMetrics = bridge.getMetrics();
      
      return NextResponse.json({
        success: true,
        python: {
          health: pythonHealth,
          metrics: pythonMetrics,
          url: process.env.FASTAPI_BASE_URL
        },
        timestamp: new Date().toISOString()
      });
      
    default:
      throw new Error(`지원하지 않는 액션: ${action}`);
  }
}

/**
 * 🏥 헬스 상태 확인
 */
async function getHealthStatus() {
  const memoryUsage = process.memoryUsage();
  const memoryThreshold = 512 * 1024 * 1024; // 512MB
  const bridge = getPythonBridge();
  const pythonHealth = await bridge.healthCheck();
  
  const status = {
    overall: 'healthy' as 'healthy' | 'warning' | 'critical',
    components: {
      memory: {
        status: 'healthy' as 'healthy' | 'warning' | 'critical',
        usage: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        threshold: Math.round(memoryThreshold / 1024 / 1024)
      },
      python: {
        status: pythonHealth ? 'healthy' : 'critical' as 'healthy' | 'warning' | 'critical',
        connected: pythonHealth
      },
      uptime: {
        status: 'healthy' as 'healthy' | 'warning' | 'critical',
        seconds: Math.floor(process.uptime())
      }
    }
  };

  // 메모리 상태 확인
  if (memoryUsage.heapUsed > memoryThreshold * 0.8) {
    status.components.memory.status = 'warning';
    status.overall = 'warning';
  }
  if (memoryUsage.heapUsed > memoryThreshold) {
    status.components.memory.status = 'critical';
    status.overall = 'critical';
  }

  // Python 연결 상태 확인
  if (!pythonHealth) {
    status.overall = status.overall === 'critical' ? 'critical' : 'warning';
  }

  return status;
}

/**
 * 🧹 메모리 정리 실행
 */
async function performMemoryCleanup() {
  const beforeMemory = process.memoryUsage();
  console.log('🧹 메모리 정리 시작...');
  
  // 객체 풀 정리
  memoryManager.cleanup();
  
  // 가비지 컬렉션 (가능한 경우)
  if (global.gc) {
    global.gc();
  }
  
  // 정리 후 메모리 상태
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1초 대기
  const afterMemory = process.memoryUsage();
  
  const result = {
    before: {
      heapUsed: Math.round(beforeMemory.heapUsed / 1024 / 1024),
      rss: Math.round(beforeMemory.rss / 1024 / 1024)
    },
    after: {
      heapUsed: Math.round(afterMemory.heapUsed / 1024 / 1024),
      rss: Math.round(afterMemory.rss / 1024 / 1024)
    },
    freed: {
      heap: Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024),
      rss: Math.round((beforeMemory.rss - afterMemory.rss) / 1024 / 1024)
    },
    gcAvailable: !!global.gc
  };
  
  console.log('✅ 메모리 정리 완료:', result);
  return result;
}

/**
 * 🔄 Python 브릿지 리셋
 */
async function resetPythonBridge() {
  console.log('🔄 Python 브릿지 리셋 시작...');
  
  // 기존 브릿지 정리
  pythonBridge = null;
  
  // 새 브릿지 생성 및 헬스체크
  const newBridge = getPythonBridge();
  const health = await newBridge.healthCheck();
  
  const result = {
    reset: true,
    health,
    url: process.env.FASTAPI_BASE_URL,
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ Python 브릿지 리셋 완료:', result);
  return result;
}

/**
 * ⚡ 캐시 최적화
 */
async function optimizeCache(parameters: any = {}) {
  console.log('⚡ 캐시 최적화 시작...');
  
  const bridge = getPythonBridge();
  const beforeMetrics = bridge.getMetrics();
  
  // 캐시 정리 (브릿지 내부에서 수행)
  bridge.clearCache();
  
  const afterMetrics = bridge.getMetrics();
  
  const result = {
    cacheClearedSize: beforeMetrics.cacheSize,
    optimizationComplete: true,
    parameters,
    metrics: {
      before: beforeMetrics,
      after: afterMetrics
    }
  };
  
  console.log('✅ 캐시 최적화 완료:', result);
  return result;
}

/**
 * 🚨 응급 정리
 */
async function performEmergencyCleanup() {
  console.log('🚨 응급 정리 시작...');
  
  const beforeMemory = process.memoryUsage();
  
  // 응급 메모리 정리
  memoryManager.emergencyCleanup();
  
  // Python 브릿지 리셋
  pythonBridge = null;
  
  // 강제 가비지 컬렉션
  if (global.gc) {
    global.gc();
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2초 대기
  const afterMemory = process.memoryUsage();
  
  const result = {
    emergency: true,
    actions: ['memory_cleanup', 'python_bridge_reset', 'garbage_collection'],
    memoryFreed: Math.round((beforeMemory.heapUsed - afterMemory.heapUsed) / 1024 / 1024),
    timestamp: new Date().toISOString()
  };
  
  console.log('✅ 응급 정리 완료:', result);
  return result;
}

/**
 * 🔥 Python 서비스 웜업
 */
async function warmupPython() {
  console.log('🔥 Python 서비스 웜업 시작...');
  
  const bridge = getPythonBridge();
  const startTime = Date.now();
  
  try {
    // 헬스체크로 웜업
    const health = await bridge.healthCheck();
    
    if (health) {
      // 간단한 분석 요청으로 완전 웜업
      await bridge.call('statistical_analysis', {
        data: [1, 2, 3, 4, 5],
        warmup: true
      });
    }
    
    const warmupTime = Date.now() - startTime;
    
    const result = {
      success: health,
      warmupTime,
      pythonHealth: health,
      url: process.env.FASTAPI_BASE_URL
    };
    
    console.log('✅ Python 웜업 완료:', result);
    return result;
    
  } catch (error: any) {
    const warmupTime = Date.now() - startTime;
    
    const result = {
      success: false,
      error: error.message,
      warmupTime,
      fallbackAvailable: true
    };
    
    console.log('❌ Python 웜업 실패:', result);
    return result;
  }
} 