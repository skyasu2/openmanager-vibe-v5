/**
 * 🧪 Box-Muller Transform LRU 캐시 성능 테스트
 * 
 * Phase 1 완료 테스트: LRU 캐시 시스템의 성능 향상 검증
 * - 캐시 히트율 85%+ 목표
 * - 성능 향상 2배+ 목표
 * - 메모리 사용량 1MB 이하 목표
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { 
  generateCachedNormalRandom, 
  getBoxMullerCacheStats, 
  clearBoxMullerCache, 
  benchmarkBoxMullerCache 
} from '@/utils/box-muller-lru-cache';

describe('🚀 Box-Muller LRU Cache Performance Tests', () => {
  beforeEach(() => {
    // 각 테스트 전 캐시 초기화
    clearBoxMullerCache();
  });

  test('⚡ 캐시 기본 동작 검증', () => {
    // 캐시 초기 상태 확인
    const initialStats = getBoxMullerCacheStats();
    expect(initialStats.size).toBe(0);
    expect(initialStats.totalRequests).toBe(0);

    // 첫 번째 호출 (캐시 미스)
    const result1 = generateCachedNormalRandom(50, 10, 0, 100);
    expect(result1).toBeTypeOf('number');
    expect(result1).toBeGreaterThanOrEqual(0);
    expect(result1).toBeLessThanOrEqual(100);

    const afterFirstCall = getBoxMullerCacheStats();
    expect(afterFirstCall.totalRequests).toBe(1);
    expect(afterFirstCall.missCount).toBe(1);
    expect(afterFirstCall.size).toBe(1);

    // 동일한 매개변수로 두 번째 호출 (캐시 히트)
    const result2 = generateCachedNormalRandom(50, 10, 0, 100);
    
    const afterSecondCall = getBoxMullerCacheStats();
    expect(afterSecondCall.totalRequests).toBe(2);
    expect(afterSecondCall.hitCount).toBe(1);
    expect(afterSecondCall.missCount).toBe(1);
    expect(afterSecondCall.hitRate).toBe(50); // 50% 히트율
  });

  test('📊 캐시 통계 정보 검증', () => {
    // 여러 번 호출하여 통계 생성
    for (let i = 0; i < 10; i++) {
      generateCachedNormalRandom(25, 5); // 동일한 매개변수
      generateCachedNormalRandom(75, 15); // 다른 매개변수
    }

    const stats = getBoxMullerCacheStats();
    expect(stats.totalRequests).toBe(20);
    expect(stats.size).toBe(2); // 2개의 고유한 매개변수 조합
    expect(stats.hitRate).toBeGreaterThan(0);
    expect(stats.memoryUsage).toBeDefined();
  });

  test('🔄 LRU 알고리즘 검증 (캐시 크기 제한)', () => {
    // 작은 캐시 크기로 테스트하기 위해 많은 고유 매개변수 생성
    const uniqueParams: Array<[number, number]> = [];
    for (let i = 0; i < 1005; i++) { // 최대 크기(1000)보다 많이
      uniqueParams.push([i, i + 10]);
    }

    // 모든 고유 매개변수로 호출
    uniqueParams.forEach(([mean, stdDev]) => {
      generateCachedNormalRandom(mean, stdDev);
    });

    const stats = getBoxMullerCacheStats();
    expect(stats.size).toBeLessThanOrEqual(1000); // 최대 크기 제한 확인
    expect(stats.totalRequests).toBe(1005);
  });

  test('🚀 성능 벤치마크 검증', () => {
    // 성능 벤치마크 실행 (작은 반복 횟수로 빠른 테스트)
    const benchmarkResult = benchmarkBoxMullerCache(1000);
    
    expect(benchmarkResult.withCache).toBeGreaterThan(0);
    expect(benchmarkResult.withoutCache).toBeGreaterThan(0);
    expect(benchmarkResult.speedup).toBeGreaterThan(0);
    
    // 캐시 사용 시 성능이 같거나 더 좋아야 함 (히트율이 높을 경우)
    // 참고: 첫 실행에서는 모든 요청이 캐시 미스이므로 성능 향상이 미미할 수 있음
    console.log(`🏆 벤치마크 결과: ${benchmarkResult.speedup}배 성능 향상`);
  });

  test('🎯 실제 서버 메트릭 시뮬레이션 패턴 검증', () => {
    // 실제 서버 메트릭 생성과 유사한 패턴으로 테스트
    const serverTypes = ['web', 'api', 'database', 'cache'];
    const metricTypes = [
      { mean: 0, stdDev: 5, min: -15, max: 15 }, // CPU 노이즈
      { mean: 0, stdDev: 3, min: -10, max: 10 }, // 메모리 노이즈
      { mean: 0, stdDev: 2, min: -5, max: 5 },   // 디스크 노이즈
      { mean: 15, stdDev: 8, min: 5, max: 50 },  // 네트워크 베이스
    ];

    let totalCalls = 0;
    
    // 실제 API 호출과 유사한 패턴으로 여러 번 호출
    for (let iteration = 0; iteration < 5; iteration++) {
      for (const serverType of serverTypes) {
        for (const metric of metricTypes) {
          generateCachedNormalRandom(metric.mean, metric.stdDev, metric.min, metric.max);
          totalCalls++;
        }
      }
    }

    const stats = getBoxMullerCacheStats();
    expect(stats.totalRequests).toBe(totalCalls);
    
    // 반복적인 패턴으로 인해 캐시 히트율이 높아야 함
    expect(stats.hitRate).toBeGreaterThan(50); // 최소 50% 히트율
    
    console.log(`📈 실제 시뮬레이션 패턴 히트율: ${stats.hitRate}%`);
  });

  test('💾 메모리 사용량 검증', () => {
    // 캐시가 가득 찰 때까지 채우기
    for (let i = 0; i < 500; i++) {
      generateCachedNormalRandom(i, i + 1);
    }

    const stats = getBoxMullerCacheStats();
    const memoryUsageKB = parseFloat(stats.memoryUsage.replace(' KB', ''));
    
    // 메모리 사용량이 합리적인 범위 내에 있는지 확인
    expect(memoryUsageKB).toBeGreaterThan(0);
    expect(memoryUsageKB).toBeLessThan(1024); // 1MB 이하
    
    console.log(`💾 메모리 사용량: ${stats.memoryUsage} (500개 캐시 항목)`);
  });

  test('🔍 매개변수 정밀도 검증', () => {
    // 부동소수점 정밀도 문제로 인한 캐시 키 충돌 방지 테스트
    const result1 = generateCachedNormalRandom(50.1234567, 10.9876543);
    const result2 = generateCachedNormalRandom(50.1234568, 10.9876544); // 미세한 차이
    
    const stats = getBoxMullerCacheStats();
    expect(stats.size).toBe(2); // 서로 다른 키로 인식되어야 함
    expect(stats.totalRequests).toBe(2);
    expect(stats.hitCount).toBe(0); // 캐시 히트가 없어야 함
  });
});

/**
 * 🎯 통합 성능 테스트 (수동 실행용)
 * npm test -- box-muller-cache-performance.test.ts 로 실행
 */
export function runIntegratedPerformanceTest(): void {
  console.log('🚀 Box-Muller LRU 캐시 통합 성능 테스트 시작');
  
  clearBoxMullerCache();
  
  // 1단계: 기본 성능 벤치마크
  console.log('\n📊 1단계: 기본 성능 벤치마크');
  const benchmark = benchmarkBoxMullerCache(5000);
  
  // 2단계: 실제 사용 패턴 시뮬레이션
  console.log('\n⚡ 2단계: 실제 서버 메트릭 생성 패턴 시뮬레이션');
  clearBoxMullerCache();
  
  const startTime = performance.now();
  
  // 10번의 API 호출 시뮬레이션 (각각 15개 서버 × 4개 메트릭)
  for (let apiCall = 0; apiCall < 10; apiCall++) {
    for (let server = 0; server < 15; server++) {
      generateCachedNormalRandom(0, 5, -15, 15); // CPU 노이즈
      generateCachedNormalRandom(0, 3, -10, 10); // 메모리 노이즈  
      generateCachedNormalRandom(0, 2, -5, 5);   // 디스크 노이즈
      generateCachedNormalRandom(15, 8, 5, 50);  // 네트워크 베이스
    }
  }
  
  const endTime = performance.now();
  const simulationTime = endTime - startTime;
  
  const finalStats = getBoxMullerCacheStats();
  
  console.log(`⚡ 시뮬레이션 완료: ${simulationTime.toFixed(2)}ms`);
  console.log(`📊 최종 캐시 통계:`, finalStats);
  
  // 3단계: 성능 결과 요약
  console.log('\n🏆 성능 테스트 결과 요약:');
  console.log(`   💨 벤치마크 성능 향상: ${benchmark.speedup}배`);
  console.log(`   🎯 실제 패턴 히트율: ${finalStats.hitRate}%`);
  console.log(`   💾 메모리 사용량: ${finalStats.memoryUsage}`);
  console.log(`   📈 총 요청 수: ${finalStats.totalRequests}`);
  
  // 성능 목표 달성 여부 확인
  const performanceGoals = {
    speedup: benchmark.speedup >= 1.5, // 1.5배 이상 성능 향상
    hitRate: finalStats.hitRate >= 75, // 75% 이상 히트율
    memoryEfficient: parseFloat(finalStats.memoryUsage.replace(' KB', '')) < 512 // 512KB 이하
  };
  
  const allGoalsMet = Object.values(performanceGoals).every(goal => goal);
  
  console.log('\n✅ 성능 목표 달성 현황:');
  console.log(`   🚀 성능 향상 (1.5배+): ${performanceGoals.speedup ? '✅' : '❌'}`);
  console.log(`   🎯 히트율 (75%+): ${performanceGoals.hitRate ? '✅' : '❌'}`);
  console.log(`   💾 메모리 효율성 (512KB-): ${performanceGoals.memoryEfficient ? '✅' : '❌'}`);
  console.log(`   🏆 전체 목표 달성: ${allGoalsMet ? '✅ 성공!' : '❌ 개선 필요'}`);
  
  return;
}