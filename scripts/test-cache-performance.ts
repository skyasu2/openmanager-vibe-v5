#!/usr/bin/env tsx
/**
 * 🚀 Upstash Redis 캐시 성능 테스트
 * 
 * 레이턴시 및 히트율 개선 확인
 */

import { config } from 'dotenv';
import { performance } from 'perf_hooks';

// 환경변수 로드
config({ path: '.env.local' });

interface TestResult {
  operation: string;
  duration: number;
  success: boolean;
  details?: any;
}

const results: TestResult[] = [];

/**
 * 테스트 실행 및 측정
 */
async function runTest(name: string, fn: () => Promise<any>): Promise<TestResult> {
  console.log(`\n🧪 테스트: ${name}`);
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    const testResult: TestResult = {
      operation: name,
      duration: Math.round(duration * 100) / 100,
      success: true,
      details: result,
    };
    
    console.log(`✅ 성공 (${testResult.duration}ms)`);
    results.push(testResult);
    return testResult;
  } catch (error) {
    const duration = performance.now() - start;
    const testResult: TestResult = {
      operation: name,
      duration: Math.round(duration * 100) / 100,
      success: false,
      details: error instanceof Error ? error.message : 'Unknown error',
    };
    
    console.error(`❌ 실패 (${testResult.duration}ms):`, error);
    results.push(testResult);
    return testResult;
  }
}

/**
 * API 호출 헬퍼
 */
async function fetchAPI(endpoint: string, options?: RequestInit) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API 오류: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * 메인 테스트 실행
 */
async function main() {
  console.log('🚀 Upstash Redis 캐시 성능 테스트 시작\n');
  
  // 1. 캐시 상태 확인
  await runTest('캐시 통계 조회', async () => {
    return fetchAPI('/api/cache/stats');
  });
  
  // 2. 첫 번째 서버 목록 조회 (캐시 미스)
  const firstFetch = await runTest('서버 목록 첫 조회 (캐시 미스)', async () => {
    return fetchAPI('/api/servers/cached?refresh=true');
  });
  
  // 3. 두 번째 서버 목록 조회 (캐시 히트)
  const secondFetch = await runTest('서버 목록 재조회 (캐시 히트)', async () => {
    return fetchAPI('/api/servers/cached');
  });
  
  // 4. 캐시 히트 시 성능 개선 계산
  if (firstFetch.success && secondFetch.success) {
    const improvement = ((firstFetch.duration - secondFetch.duration) / firstFetch.duration) * 100;
    console.log(`\n📊 캐시 히트 성능 개선: ${improvement.toFixed(2)}%`);
    console.log(`   - 캐시 미스: ${firstFetch.duration}ms`);
    console.log(`   - 캐시 히트: ${secondFetch.duration}ms`);
  }
  
  // 5. 배치 작업 테스트
  await runTest('배치 캐시 워밍업', async () => {
    return fetchAPI('/api/cache/optimize', {
      method: 'POST',
      body: JSON.stringify({
        action: 'warmup',
        options: { targets: ['servers', 'summary'] },
      }),
    });
  });
  
  // 6. 병렬 요청 테스트 (파이프라인 효과)
  await runTest('병렬 캐시 조회 (10개)', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => 
      fetchAPI(`/api/servers/cached?id=${i}`)
    );
    return Promise.all(promises);
  });
  
  // 7. 캐시 최적화 실행
  await runTest('캐시 최적화', async () => {
    return fetchAPI('/api/cache/optimize', {
      method: 'POST',
      body: JSON.stringify({ action: 'optimize' }),
    });
  });
  
  // 8. 최종 캐시 통계
  const finalStats = await runTest('최종 캐시 통계', async () => {
    return fetchAPI('/api/cache/stats');
  });
  
  // 결과 요약
  console.log('\n' + '='.repeat(60));
  console.log('📊 테스트 결과 요약\n');
  
  // 성공/실패 통계
  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;
  console.log(`✅ 성공: ${successCount}개`);
  console.log(`❌ 실패: ${failCount}개`);
  
  // 평균 응답 시간
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`⏱️  평균 응답 시간: ${avgDuration.toFixed(2)}ms`);
  
  // 캐시 성능 분석
  if (finalStats.success && finalStats.details) {
    const { stats, performance: perf } = finalStats.details;
    console.log('\n📈 캐시 성능 지표:');
    console.log(`   - 캐시 히트율: ${stats.hitRate?.toFixed(2) || 0}%`);
    console.log(`   - 성능 등급: ${perf?.grade || 'N/A'}`);
    console.log(`   - 총 작업 수: ${perf?.totalOperations || 0}`);
    console.log(`   - 에러율: ${perf?.errorRate || 0}%`);
    
    if (perf?.recommendations?.length > 0) {
      console.log('\n💡 개선 권장사항:');
      perf.recommendations.forEach((rec: string, i: number) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }
  }
  
  // 상세 결과 테이블
  console.log('\n📋 상세 테스트 결과:');
  console.table(results.map(r => ({
    작업: r.operation,
    '시간(ms)': r.duration,
    상태: r.success ? '✅' : '❌',
  })));
  
  console.log('\n✨ 테스트 완료');
}

// 실행
main().catch(console.error);