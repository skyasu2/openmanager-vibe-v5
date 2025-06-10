/**
 * 🚀 API v1 메인 라우터
 *
 * 새로운 v1 API 구조의 통합 엔드포인트
 * - API 문서화
 * - 라우팅 안내
 * - 시스템 상태 종합
 */

import { NextRequest, NextResponse } from 'next/server';
import { unifiedAIEngine } from '@/core/ai/UnifiedAIEngine';
import {
  globalQueryCache,
  globalMetricsCache,
  globalMonitoringCache,
} from '@/lib/cache/AICache';

/**
 * 📋 API v1 메인 정보
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'health':
        return await getSystemHealth();

      case 'stats':
        return await getSystemStats();

      case 'migration':
        return getMigrationGuide();

      default:
        return getApiDocumentation();
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'error',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 📚 API 문서화
 */
function getApiDocumentation() {
  return NextResponse.json({
    name: 'OpenManager Vibe AI API v1',
    version: 'v1.0.0',
    description: '통합 AI 서버 모니터링 및 분석 API',

    // 🎯 새로운 통합 엔드포인트들
    endpoints: {
      '/api/v1/ai/query': {
        methods: ['POST', 'GET'],
        description: '🧠 통합 AI 쿼리 및 분석',
        features: [
          'UnifiedAIEngine 기반 분석',
          '인메모리 캐싱',
          '다중 AI 엔진 지원',
          'Intent 분류 및 최적화',
        ],
      },
      '/api/v1/ai/metrics': {
        methods: ['POST', 'GET'],
        description: '📊 서버 메트릭 전용 분석',
        features: [
          '실시간 메트릭 처리',
          '성능 점수 계산',
          '트렌드 분석',
          '이상 탐지',
          '예측 분석',
        ],
      },
      '/api/v1/ai/monitor': {
        methods: ['POST', 'GET'],
        description: '🖥️ 실시간 서버 모니터링',
        features: [
          '임계값 기반 알림',
          '자동 이슈 탐지',
          '액션 아이템 생성',
          '성능 스코어링',
        ],
      },
    },

    // 🔄 기존 API에서 v1으로 마이그레이션
    migration: {
      from: {
        '/api/ai/mcp': '→ /api/v1/ai/query',
        '/api/ai-agent': '→ /api/v1/ai/query',
        '/api/dashboard': '→ /api/v1/ai/monitor',
      },
      benefits: [
        '✅ 통합된 응답 형식',
        '⚡ 향상된 캐싱',
        '🧠 더 정확한 AI 분석',
        '📊 더 자세한 메트릭 정보',
        '🛡️ 더 나은 오류 처리',
      ],
    },

    // 📈 성능 개선사항
    improvements: {
      caching: '인메모리 캐시로 응답 속도 향상',
      unification: 'UnifiedAIEngine으로 중복 제거',
      optimization: 'Python ML 서비스 사전 로드',
      monitoring: '실시간 모니터링 강화',
      analytics: '더 정확한 성능 분석',
    },

    // 🔧 사용법 예시
    examples: {
      basic_query: {
        url: '/api/v1/ai/query',
        method: 'POST',
        body: {
          query: '서버 상태를 분석해주세요',
          context: {
            serverMetrics: [
              {
                timestamp: '2025-06-01T00:00:00Z',
                cpu: 75,
                memory: 80,
                disk: 60,
              },
            ],
          },
        },
      },
      metrics_analysis: {
        url: '/api/v1/ai/metrics',
        method: 'POST',
        body: {
          metrics: [
            {
              timestamp: '2025-06-01T00:00:00Z',
              cpu: 75,
              memory: 80,
              disk: 60,
            },
          ],
          analysisType: 'performance',
        },
      },
      monitoring_check: {
        url: '/api/v1/ai/monitor',
        method: 'POST',
        body: {
          serverName: 'web-server-01',
          currentStatus: {
            timestamp: '2025-06-01T00:00:00Z',
            cpu: 75,
            memory: 80,
            disk: 60,
          },
          checkType: 'health',
        },
      },
    },

    timestamp: new Date().toISOString(),
  });
}

/**
 * 🏥 시스템 종합 헬스체크
 */
async function getSystemHealth() {
  try {
    // UnifiedAIEngine 상태
    const aiStatus = await unifiedAIEngine.getSystemStatus();

    // 캐시 상태
    const cacheStats = {
      query: globalQueryCache.getStats(),
      metrics: globalMetricsCache.getStats(),
      monitoring: globalMonitoringCache.getStats(),
    };

    return NextResponse.json({
      status: 'healthy',
      version: 'v1.0.0',
      timestamp: new Date().toISOString(),

      components: {
        unifiedAIEngine: {
          status: aiStatus.initialized ? 'healthy' : 'initializing',
          details: aiStatus,
        },
        caching: {
          status: 'healthy',
          stats: cacheStats,
          totalEntries: Object.values(cacheStats).reduce(
            (sum, cache) => sum + cache.totalEntries,
            0
          ),
          averageHitRate:
            Object.values(cacheStats).reduce(
              (sum, cache) => sum + cache.hitRate,
              0
            ) / 3,
        },
        apis: {
          status: 'operational',
          endpoints: ['query', 'metrics', 'monitor'],
          features: ['caching', 'analytics', 'monitoring'],
        },
      },

      performance: {
        cachingEnabled: true,
        unifiedEngine: true,
        pythonOptimized: true,
        realTimeMonitoring: true,
      },

      uptime:
        typeof process !== 'undefined' && typeof process.uptime === 'function'
          ? process.uptime()
          : 0,
      memoryUsage:
        typeof process !== 'undefined' &&
        typeof process.memoryUsage === 'function'
          ? process.memoryUsage()
          : { rss: 0, heapTotal: 0, heapUsed: 0, external: 0, arrayBuffers: 0 },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 'degraded',
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}

/**
 * 📊 시스템 통계
 */
async function getSystemStats() {
  try {
    const cacheStats = {
      query: globalQueryCache.getStats(),
      metrics: globalMetricsCache.getStats(),
      monitoring: globalMonitoringCache.getStats(),
    };

    const totalRequests = Object.values(cacheStats).reduce(
      (sum, cache) => sum + cache.totalHits + cache.totalMisses,
      0
    );

    const totalHits = Object.values(cacheStats).reduce(
      (sum, cache) => sum + cache.totalHits,
      0
    );

    return NextResponse.json({
      statistics: {
        requests: {
          total: totalRequests,
          cached: totalHits,
          cache_hit_rate:
            totalRequests > 0
              ? ((totalHits / totalRequests) * 100).toFixed(2) + '%'
              : '0%',
        },
        caching: cacheStats,
        memory: {
          used:
            typeof process !== 'undefined' &&
            typeof process.memoryUsage === 'function'
              ? process.memoryUsage().heapUsed
              : 0,
          total:
            typeof process !== 'undefined' &&
            typeof process.memoryUsage === 'function'
              ? process.memoryUsage().heapTotal
              : 0,
          external:
            typeof process !== 'undefined' &&
            typeof process.memoryUsage === 'function'
              ? process.memoryUsage().external
              : 0,
        },
        system: {
          uptime:
            typeof process !== 'undefined' &&
            typeof process.uptime === 'function'
              ? process.uptime()
              : 0,
          platform: process.platform,
          node_version: process.version,
        },
      },

      performance_metrics: {
        optimization_level: 'high',
        features_enabled: [
          'unified_ai_engine',
          'memory_caching',
          'python_preloading',
          'real_time_monitoring',
        ],
      },

      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to get system stats',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * 🔄 마이그레이션 가이드
 */
function getMigrationGuide() {
  return NextResponse.json({
    title: 'API v1 마이그레이션 가이드',
    version: 'v1.0.0',

    migration_steps: [
      {
        step: 1,
        title: '기존 API 호출 확인',
        current_apis: [
          '/api/ai/mcp',
          '/api/ai-agent',
          '/api/dashboard (AI 관련)',
        ],
        status: '✅ 여전히 작동하지만 deprecated',
      },
      {
        step: 2,
        title: 'v1 API로 전환',
        new_apis: [
          '/api/v1/ai/query - 모든 AI 쿼리',
          '/api/v1/ai/metrics - 메트릭 분석',
          '/api/v1/ai/monitor - 실시간 모니터링',
        ],
        status: '🚀 새로운 기능 추가',
      },
      {
        step: 3,
        title: '응답 형식 업데이트',
        changes: [
          '통일된 success/error 형식',
          '더 자세한 메타데이터',
          '캐싱 정보 포함',
          '성능 메트릭 추가',
        ],
        status: '📊 더 나은 정보 제공',
      },
    ],

    code_examples: {
      before: {
        url: '/api/ai/mcp',
        code: `fetch('/api/ai/mcp', {
  method: 'POST',
  body: JSON.stringify({ query: '서버 상태', context: {...} })
})`,
      },
      after: {
        url: '/api/v1/ai/query',
        code: `fetch('/api/v1/ai/query', {
  method: 'POST', 
  body: JSON.stringify({ 
    query: '서버 상태',
    context: { serverMetrics: [...], urgency: 'medium' },
    options: { enablePython: true }
  })
})`,
      },
    },

    benefits: [
      '⚡ 캐싱으로 2-5배 빠른 응답',
      '🧠 UnifiedAIEngine으로 더 정확한 분석',
      '📊 실시간 성능 모니터링',
      '🛡️ 향상된 오류 처리',
      '📈 더 자세한 분석 결과',
    ],

    timeline: {
      current: 'v1 API 출시 (권장)',
      deprecated: '기존 API는 6개월간 지원',
      sunset: '기존 API 종료 예정',
    },

    timestamp: new Date().toISOString(),
  });
}
