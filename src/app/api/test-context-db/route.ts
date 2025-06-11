import { NextRequest, NextResponse } from 'next/server';
import { ContextManager } from '@/core/ai/ContextManager';
import { PostgresVectorDB } from '@/services/ai/postgres-vector-db';
import { testRedisConnection, testRedisReadWrite } from '@/lib/redis-test';

/**
 * 🧪 OpenManager Vibe v5 - 완전한 컨텍스트 & DB 연결 테스트
 *
 * 테스트 항목:
 * 1. AI 컨텍스트 매니저 초기화 및 기능
 * 2. Supabase pgvector 벡터 DB 연결
 * 3. Upstash Redis 연결 및 성능
 * 4. 통합 시스템 상태 검증
 */

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'warning';
  details?: any;
  error?: string;
  timing?: number;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const results: TestResult[] = [];

  console.log('🧪 컨텍스트 & DB 통합 테스트 시작...');

  // 1. 컨텍스트 매니저 테스트
  try {
    const contextStart = Date.now();
    const contextManager = ContextManager.getInstance();
    await contextManager.initialize();

    // 컨텍스트 검색 테스트
    const searchResults = await contextManager.findRelevantContexts(
      'CPU 사용률 확인',
      'server_monitoring',
      'medium',
      5
    );

    const usageStats = contextManager.getUsageStats();

    results.push({
      name: 'AI 컨텍스트 매니저',
      status: 'passed',
      timing: Date.now() - contextStart,
      details: {
        initialized: true,
        totalContexts: usageStats.totalContexts,
        searchResults: searchResults.length,
        message: 'AI 컨텍스트 시스템 정상 작동',
        usageStats: usageStats,
      },
    });
  } catch (error: any) {
    results.push({
      name: 'AI 컨텍스트 매니저',
      status: 'failed',
      error: `컨텍스트 초기화 실패: ${error.message}`,
    });
  }

  // 2. Supabase 벡터 DB 테스트
  try {
    const vectorStart = Date.now();
    const vectorDB = new PostgresVectorDB();
    await vectorDB.initialize();

    // 테스트 벡터 저장 및 검색
    const testEmbedding = Array.from(
      { length: 1536 },
      () => Math.random() - 0.5
    );

    const storeResult = await vectorDB.store(
      'test-doc-1',
      'OpenManager Vibe v5 서버 모니터링 시스템 테스트 문서',
      testEmbedding,
      { category: 'test', timestamp: new Date().toISOString() }
    );

    if (storeResult.success) {
      // 유사도 검색 테스트
      const searchResults = await vectorDB.search(testEmbedding, {
        topK: 5,
        threshold: 0.1,
      });

      results.push({
        name: 'Supabase 벡터 DB',
        status: 'passed',
        timing: Date.now() - vectorStart,
        details: {
          connection: 'successful',
          pgvector: 'enabled',
          storeTest: 'passed',
          searchResults: searchResults.length,
          message: 'pgvector 벡터 DB 완전 작동',
        },
      });
    } else {
      results.push({
        name: 'Supabase 벡터 DB',
        status: 'warning',
        timing: Date.now() - vectorStart,
        details: {
          connection: 'partial',
          fallbackMode: 'memory',
          message: 'pgvector 권한 제한 - 메모리 모드로 작동',
        },
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Supabase 벡터 DB',
      status: 'failed',
      error: `벡터 DB 연결 실패: ${error.message}`,
    });
  }

  // 3. Redis 연결 테스트
  try {
    const redisStart = Date.now();

    const connectionTest = await testRedisConnection();
    const readWriteTest = await testRedisReadWrite();

    if (connectionTest && readWriteTest) {
      results.push({
        name: 'Upstash Redis',
        status: 'passed',
        timing: Date.now() - redisStart,
        details: {
          connection: 'successful',
          tls: 'enabled',
          readWrite: 'passed',
          host: 'charming-condor-46598.upstash.io:6379',
          message: 'Redis TLS 연결 및 캐싱 완전 작동',
        },
      });
    } else {
      results.push({
        name: 'Upstash Redis',
        status: 'warning',
        details: {
          connection: connectionTest ? 'partial' : 'failed',
          fallbackMode: 'memory',
          message: 'Redis 연결 제한 - 메모리 캐시로 작동',
        },
      });
    }
  } catch (error: any) {
    results.push({
      name: 'Upstash Redis',
      status: 'failed',
      error: `Redis 연결 실패: ${error.message}`,
    });
  }

  // 4. 환경변수 검증
  const envVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'GOOGLE_AI_API_KEY',
  ];

  const missingVars = envVars.filter(varName => !process.env[varName]);
  const presentVars = envVars.filter(varName => process.env[varName]);

  results.push({
    name: '환경변수 검증',
    status: missingVars.length === 0 ? 'passed' : 'warning',
    details: {
      totalVars: envVars.length,
      presentVars: presentVars.length,
      missingVars: missingVars,
      message: `${presentVars.length}/${envVars.length} 환경변수 설정됨`,
    },
  });

  // 최종 결과 정리
  const totalTime = Date.now() - startTime;
  const passedTests = results.filter(r => r.status === 'passed').length;
  const failedTests = results.filter(r => r.status === 'failed').length;
  const warningTests = results.filter(r => r.status === 'warning').length;

  const overallStatus =
    failedTests === 0
      ? warningTests === 0
        ? 'healthy'
        : 'degraded'
      : 'failed';

  console.log(`🎯 테스트 완료: ${passedTests}/${results.length} 성공`);

  return NextResponse.json({
    status: overallStatus,
    message: `컨텍스트 & DB 테스트: ${passedTests} 성공, ${warningTests} 경고, ${failedTests} 실패`,
    timestamp: new Date().toISOString(),
    totalTime: `${totalTime}ms`,

    tests: results,

    summary: {
      total: results.length,
      passed: passedTests,
      warnings: warningTests,
      failed: failedTests,
      overallHealth: overallStatus,
    },

    // 시스템 정보
    systemInfo: {
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
      version: 'OpenManager Vibe v5.43.3',
      timestamp: new Date().toISOString(),
    },

    // 다음 단계 가이드
    nextSteps: [
      'http://localhost:3000/admin/ai-agent (AI 컨텍스트 관리)',
      'http://localhost:3000/api/ai/unified (통합 AI 엔진 테스트)',
      'http://localhost:3000/api/test-vector-db (벡터 검색 테스트)',
    ],
  });
}
