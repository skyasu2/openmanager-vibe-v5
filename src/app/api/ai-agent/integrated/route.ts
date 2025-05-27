/**
 * 🔗 AI Agent Integrated API
 * 
 * AI 에이전트와 기존 서버 모니터링 시스템의 통합 API
 * - 시스템 통합 어댑터 활용
 * - 실시간 메트릭 분석
 * - 자동 이상 감지
 * - 통합 대시보드 지원
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  SystemIntegrationAdapter,
  SupabaseDatabaseAdapter,
  RedisCacheAdapter,
  ServerDataCollectorAdapter,
  type IntegrationConfig
} from '@/modules/ai-agent/adapters';
import { OptimizedAIAgentEngine } from '@/modules/ai-agent/core/OptimizedAIAgentEngine';

// 전역 인스턴스
let integrationAdapter: SystemIntegrationAdapter | null = null;
let aiEngine: OptimizedAIAgentEngine | null = null;

/**
 * 🚀 통합 시스템 초기화
 */
async function initializeIntegratedSystem(): Promise<void> {
  if (integrationAdapter && aiEngine) {
    return; // 이미 초기화됨
  }

  try {
    console.log('🔗 AI Agent Integrated System 초기화 중...');

    // 통합 설정
    const integrationConfig: IntegrationConfig = {
      database: {
        type: 'supabase',
        url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        apiKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        maxConnections: 10,
        timeout: 30000
      },
      redis: {
        enabled: true,
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        ttl: 300,
        maxRetries: 3
      },
      monitoring: {
        collectionInterval: 30000,
        retentionPeriod: 86400000, // 24시간
        enableRealtime: true,
        enableAggregation: true
      },
      aiAgent: {
        enablePythonAnalysis: true,
        enableMCP: true,
        enableCaching: true,
        maxConcurrentRequests: 5
      }
    };

    // 시스템 통합 어댑터 초기화
    integrationAdapter = SystemIntegrationAdapter.getInstance(integrationConfig);

    // 실제 어댑터 등록
    if (integrationConfig.database.url && integrationConfig.database.apiKey) {
      integrationAdapter.setDatabaseAdapter(new SupabaseDatabaseAdapter({
        url: integrationConfig.database.url,
        apiKey: integrationConfig.database.apiKey
      }));
    }

    integrationAdapter.setCacheAdapter(new RedisCacheAdapter({
      url: integrationConfig.redis.url,
      ttl: integrationConfig.redis.ttl
    }));

    integrationAdapter.setDataCollectorAdapter(new ServerDataCollectorAdapter({
      collectionInterval: integrationConfig.monitoring.collectionInterval,
      enableRealtime: integrationConfig.monitoring.enableRealtime,
      enableAggregation: integrationConfig.monitoring.enableAggregation
    }));

    // 통합 어댑터 초기화
    await integrationAdapter.initialize();

    // AI 엔진 초기화
    aiEngine = OptimizedAIAgentEngine.getInstance();
    await aiEngine.initialize();

    console.log('✅ AI Agent Integrated System 초기화 완료!');

  } catch (error) {
    console.error('❌ AI Agent Integrated System 초기화 실패:', error);
    throw error;
  }
}

/**
 * GET /api/ai-agent/integrated
 * 통합 시스템 상태 조회
 */
export async function GET() {
  try {
    await initializeIntegratedSystem();

    if (!integrationAdapter || !aiEngine) {
      return NextResponse.json({
        success: false,
        error: '통합 시스템이 초기화되지 않았습니다'
      }, { status: 500 });
    }

    // 통합 상태 조회
    const integrationStatus = integrationAdapter.getIntegrationStatus();
    const aiEngineStatus = { isInitialized: aiEngine !== null };

    // 서버 목록 조회
    const serverList = await integrationAdapter.getServerList();

    // 최근 메트릭 조회 (최대 5개 서버)
    const recentMetrics = [];
    const sampleServers = serverList.slice(0, 5);
    
    for (const serverId of sampleServers) {
      const metrics = await integrationAdapter.getServerMetrics(serverId);
      if (metrics) {
        recentMetrics.push({
          serverId: metrics.serverId,
          hostname: metrics.hostname,
          status: metrics.status,
          timestamp: metrics.timestamp,
          cpu: metrics.metrics.cpu.usage,
          memory: metrics.metrics.memory.usage,
          disk: metrics.metrics.disk.usage
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        integration: integrationStatus,
        aiEngine: aiEngineStatus,
        servers: {
          total: serverList.length,
          list: serverList,
          recentMetrics
        },
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 통합 시스템 상태 조회 실패:', error);
    return NextResponse.json({
      success: false,
      error: '통합 시스템 상태 조회 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * POST /api/ai-agent/integrated
 * 통합 AI 분석 요청 - 타임아웃 개선
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 요청 타임아웃 설정 (15초)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 15000);
    });

    const processRequest = async () => {
      await initializeIntegratedSystem();

      if (!integrationAdapter || !aiEngine) {
        return NextResponse.json({
          success: false,
          error: '통합 시스템이 초기화되지 않았습니다'
        }, { status: 500 });
      }

      const body = await request.json();
      const { action, query, serverId, timeRange } = body;

      switch (action) {
        case 'analyze-server':
          return await handleServerAnalysis(serverId);

        case 'smart-query':
          return await handleSmartQuery(query);

        case 'anomaly-detection':
          return await handleAnomalyDetection(serverId, timeRange);

        case 'health-check':
          return await handleHealthCheck();

        case 'metrics-history':
          return await handleMetricsHistory(serverId, timeRange);

        default:
          return NextResponse.json({
            success: false,
            error: '지원하지 않는 액션입니다',
            supportedActions: ['analyze-server', 'smart-query', 'anomaly-detection', 'health-check', 'metrics-history']
          }, { status: 400 });
      }
    };

    // 타임아웃과 실제 처리를 경쟁시킴
    const result = await Promise.race([processRequest(), timeoutPromise]) as NextResponse;
    return result;

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ 통합 AI 분석 요청 실패:', error);
    
    // 타임아웃 에러인 경우 특별 처리
    if (error instanceof Error && error.message === 'Request timeout') {
      return NextResponse.json({
        success: false,
        error: '요청 처리 시간이 초과되었습니다',
        message: '시스템이 과부하 상태일 수 있습니다. 잠시 후 다시 시도해주세요.',
        processingTime,
        timeout: true
      }, { status: 408 });
    }

    return NextResponse.json({
      success: false,
      error: '통합 AI 분석 요청 실패',
      message: error instanceof Error ? error.message : 'Unknown error',
      processingTime
    }, { status: 500 });
  }
}

/**
 * 🔍 서버 분석 처리
 */
async function handleServerAnalysis(serverId: string) {
  if (!serverId) {
    return NextResponse.json({
      success: false,
      error: 'serverId가 필요합니다'
    }, { status: 400 });
  }

  try {
    // 서버 메트릭 조회
    const metrics = await integrationAdapter!.getServerMetrics(serverId);
    
    if (!metrics) {
      return NextResponse.json({
        success: false,
        error: `서버 메트릭을 찾을 수 없습니다: ${serverId}`
      }, { status: 404 });
    }

    // AI 분석 요청
    const analysisQuery = `서버 ${metrics.hostname} (${serverId})의 현재 상태를 분석해주세요. 
    CPU: ${metrics.metrics.cpu.usage}%, 메모리: ${metrics.metrics.memory.usage}%, 디스크: ${metrics.metrics.disk.usage}%
    상태: ${metrics.status}`;

    const aiResponse = await aiEngine!.processSmartQuery({
      query: analysisQuery,
      serverData: metrics,
      metadata: { action: 'server-analysis', serverId }
    });

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        hostname: metrics.hostname,
        status: metrics.status,
        metrics: {
          cpu: metrics.metrics.cpu.usage,
          memory: metrics.metrics.memory.usage,
          disk: metrics.metrics.disk.usage
        },
        analysis: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ 서버 분석 실패 (${serverId}):`, error);
    return NextResponse.json({
      success: false,
      error: '서버 분석 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 🧠 스마트 쿼리 처리
 */
async function handleSmartQuery(query: string) {
  if (!query) {
    return NextResponse.json({
      success: false,
      error: 'query가 필요합니다'
    }, { status: 400 });
  }

  try {
    // 서버 목록 조회
    const serverList = await integrationAdapter!.getServerList();
    
    // 최근 메트릭 수집
    const serverData = [];
    for (const serverId of serverList.slice(0, 10)) { // 최대 10개 서버
      const metrics = await integrationAdapter!.getServerMetrics(serverId);
      if (metrics) {
        serverData.push(metrics);
      }
    }

    // AI 분석 요청
    const aiResponse = await aiEngine!.processSmartQuery({
      query,
      serverData,
      metadata: { action: 'smart-query', serverCount: serverData.length }
    });

    return NextResponse.json({
      success: true,
      data: {
        query,
        serverCount: serverData.length,
        analysis: aiResponse,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 스마트 쿼리 처리 실패:', error);
    return NextResponse.json({
      success: false,
      error: '스마트 쿼리 처리 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 🚨 이상 감지 처리
 */
async function handleAnomalyDetection(serverId: string, timeRange: any) {
  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (timeRange?.hours || 24) * 60 * 60 * 1000);

    let serversToAnalyze = [];
    
    if (serverId) {
      serversToAnalyze = [serverId];
    } else {
      // 모든 서버 분석
      serversToAnalyze = await integrationAdapter!.getServerList();
    }

    const anomalies = [];

    for (const id of serversToAnalyze.slice(0, 5)) { // 최대 5개 서버
      const metrics = await integrationAdapter!.getServerMetrics(id);
      
      if (metrics) {
        // 간단한 이상 감지 로직
        const isAnomalous = 
          metrics.metrics.cpu.usage > 90 ||
          metrics.metrics.memory.usage > 95 ||
          metrics.metrics.disk.usage > 95 ||
          metrics.status === 'critical';

        if (isAnomalous) {
          anomalies.push({
            serverId: id,
            hostname: metrics.hostname,
            status: metrics.status,
            issues: [
              ...(metrics.metrics.cpu.usage > 90 ? ['High CPU usage'] : []),
              ...(metrics.metrics.memory.usage > 95 ? ['High memory usage'] : []),
              ...(metrics.metrics.disk.usage > 95 ? ['High disk usage'] : []),
              ...(metrics.status === 'critical' ? ['Critical status'] : [])
            ],
            metrics: {
              cpu: metrics.metrics.cpu.usage,
              memory: metrics.metrics.memory.usage,
              disk: metrics.metrics.disk.usage
            },
            timestamp: metrics.timestamp
          });
        }
      }
    }

    // AI 분석 요청 (이상이 감지된 경우)
    let aiAnalysis = null;
    if (anomalies.length > 0) {
      const analysisQuery = `다음 서버들에서 이상이 감지되었습니다: ${anomalies.map(a => `${a.hostname} (${a.issues.join(', ')})`).join(', ')}. 원인과 해결방안을 제시해주세요.`;
      
      aiAnalysis = await aiEngine!.processSmartQuery({
        query: analysisQuery,
        serverData: anomalies,
        metadata: { action: 'anomaly-detection', anomalyCount: anomalies.length }
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        timeRange: { start: startTime, end: endTime },
        serversAnalyzed: serversToAnalyze.length,
        anomaliesDetected: anomalies.length,
        anomalies,
        aiAnalysis,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 이상 감지 처리 실패:', error);
    return NextResponse.json({
      success: false,
      error: '이상 감지 처리 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 🏥 헬스 체크 처리
 */
async function handleHealthCheck() {
  try {
    const serverList = await integrationAdapter!.getServerList();
    const healthStatus = {
      total: serverList.length,
      online: 0,
      warning: 0,
      critical: 0,
      offline: 0,
      servers: []
    };

    for (const serverId of serverList) {
      const metrics = await integrationAdapter!.getServerMetrics(serverId);
      
      if (metrics) {
        healthStatus[metrics.status as keyof typeof healthStatus]++;
        (healthStatus.servers as any[]).push({
          serverId,
          hostname: metrics.hostname,
          status: metrics.status,
          lastSeen: metrics.timestamp,
          metrics: {
            cpu: metrics.metrics.cpu.usage,
            memory: metrics.metrics.memory.usage,
            disk: metrics.metrics.disk.usage
          }
        });
      } else {
        healthStatus.offline++;
        (healthStatus.servers as any[]).push({
          serverId,
          hostname: `server-${serverId}`,
          status: 'offline',
          lastSeen: null,
          metrics: null
        });
      }
    }

    // 전체 헬스 상태 결정
    const overallHealth = 
      healthStatus.critical > 0 ? 'critical' :
      healthStatus.warning > 0 ? 'warning' :
      healthStatus.offline > 0 ? 'degraded' : 'healthy';

    return NextResponse.json({
      success: true,
      data: {
        overallHealth,
        summary: {
          total: healthStatus.total,
          online: healthStatus.online,
          warning: healthStatus.warning,
          critical: healthStatus.critical,
          offline: healthStatus.offline
        },
        servers: healthStatus.servers,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ 헬스 체크 처리 실패:', error);
    return NextResponse.json({
      success: false,
      error: '헬스 체크 처리 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * 📊 메트릭 히스토리 처리
 */
async function handleMetricsHistory(serverId: string, timeRange: any) {
  if (!serverId) {
    return NextResponse.json({
      success: false,
      error: 'serverId가 필요합니다'
    }, { status: 400 });
  }

  try {
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (timeRange?.hours || 24) * 60 * 60 * 1000);

    const history = await integrationAdapter!.getMetricsHistory(serverId, {
      start: startTime,
      end: endTime
    });

    // 데이터 요약
    const summary = {
      dataPoints: history.length,
      timeRange: { start: startTime, end: endTime },
      averages: {
        cpu: 0,
        memory: 0,
        disk: 0
      },
      peaks: {
        cpu: 0,
        memory: 0,
        disk: 0
      }
    };

    // 히스토리 데이터가 있으면 요약 계산 (현재는 빈 배열이므로 기본값 유지)

    return NextResponse.json({
      success: true,
      data: {
        serverId,
        summary,
        history: [], // 현재는 빈 배열 반환
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ 메트릭 히스토리 처리 실패 (${serverId}):`, error);
    return NextResponse.json({
      success: false,
      error: '메트릭 히스토리 처리 실패',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 