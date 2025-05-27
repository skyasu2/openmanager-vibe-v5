#!/usr/bin/env tsx
/**
 * 🧪 시계열 보간 테스트 스크립트
 * 
 * 10분 간격 데이터를 1분/5분 간격으로 보간하는 기능을 테스트합니다.
 */

import { getMetrics } from '../src/lib/supabase-metrics';
import { 
  interpolateMetrics, 
  interpolateMetricsByServer,
  getInterpolationStats,
  validateInterpolationQuality 
} from '../src/lib/interpolateMetrics';
import { 
  HybridMetricsBridge,
  getHybridMetrics,
  getOptimizedMetrics,
  getAnalyticsMetrics 
} from '../src/lib/hybrid-metrics-bridge';

// 환경 변수는 Next.js에서 자동으로 로드됩니다

/**
 * 기본 보간 테스트
 */
const testBasicInterpolation = async () => {
  console.log('\n🔬 1. 기본 보간 테스트');
  console.log('=====================================');

  try {
    // 원본 데이터 조회 (샘플)
    const originalData = await getMetrics('web-01', undefined, undefined, 20);
    console.log(`📊 원본 데이터: ${originalData.length}개`);

    if (originalData.length < 2) {
      console.warn('⚠️ 테스트를 위한 충분한 데이터가 없습니다.');
      return;
    }

    // 1분 간격 보간
    console.log('\n🔄 1분 간격 보간 테스트...');
    const interpolated1min = interpolateMetrics(originalData, {
      resolutionMinutes: 1,
      noiseLevel: 0.02,
      preserveOriginal: true
    });
    
    console.log(`✅ 1분 보간 결과: ${originalData.length} → ${interpolated1min.length}개`);

    // 5분 간격 보간
    console.log('\n🔄 5분 간격 보간 테스트...');
    const interpolated5min = interpolateMetrics(originalData, {
      resolutionMinutes: 5,
      noiseLevel: 0.01,
      preserveOriginal: true
    });

    console.log(`✅ 5분 보간 결과: ${originalData.length} → ${interpolated5min.length}개`);

    // 품질 검증
    const quality1min = validateInterpolationQuality(originalData, interpolated1min);
    const quality5min = validateInterpolationQuality(originalData, interpolated5min);

    console.log(`\n📈 품질 점수: 1분(${quality1min.qualityScore}점), 5분(${quality5min.qualityScore}점)`);

    if (quality1min.errors.length > 0) {
      console.error('❌ 1분 보간 오류:', quality1min.errors);
    }
    if (quality5min.errors.length > 0) {
      console.error('❌ 5분 보간 오류:', quality5min.errors);
    }

  } catch (error) {
    console.error('❌ 기본 보간 테스트 실패:', error);
  }
};

/**
 * 서버별 보간 테스트
 */
const testServerInterpolation = async () => {
  console.log('\n🔬 2. 서버별 보간 테스트');
  console.log('=====================================');

  try {
    // 여러 서버 데이터 조회
    const multiServerData = await getMetrics(undefined, undefined, undefined, 100);
    console.log(`📊 다중 서버 데이터: ${multiServerData.length}개`);

    if (multiServerData.length < 10) {
      console.warn('⚠️ 테스트를 위한 충분한 멀티 서버 데이터가 없습니다.');
      return;
    }

    // 서버별 보간
    console.log('\n🔄 서버별 1분 간격 보간...');
    const interpolatedMulti = interpolateMetricsByServer(multiServerData, {
      resolutionMinutes: 1,
      noiseLevel: 0.015,
      preserveOriginal: true,
      smoothingFactor: 0.1
    });

    console.log(`✅ 서버별 보간 결과: ${multiServerData.length} → ${interpolatedMulti.length}개`);

    // 통계 분석
    const stats = getInterpolationStats(interpolatedMulti);
    console.log('\n📊 보간 통계:');
    console.log(`   전체: ${stats.total}개`);
    console.log(`   원본: ${stats.original}개`);
    console.log(`   보간: ${stats.interpolated}개`);
    console.log(`   보간 비율: ${(stats.interpolationRatio * 100).toFixed(1)}%`);
    console.log(`   서버 수: ${Object.keys(stats.serverDistribution).length}개`);
    
    // 상태별 분포
    console.log('\n🚨 상태 분포:');
    Object.entries(stats.statusDistribution).forEach(([status, count]) => {
      const percentage = ((count / stats.total) * 100).toFixed(1);
      console.log(`   ${status}: ${count}개 (${percentage}%)`);
    });

  } catch (error) {
    console.error('❌ 서버별 보간 테스트 실패:', error);
  }
};

/**
 * Hybrid Bridge 테스트
 */
const testHybridBridge = async () => {
  console.log('\n🔬 3. Hybrid Metrics Bridge 테스트');
  console.log('=====================================');

  try {
    // 기본 하이브리드 조회
    console.log('\n🌉 기본 하이브리드 메트릭 조회...');
    const hybridResult = await getHybridMetrics('api-01', 1);
    
    console.log(`✅ 하이브리드 결과: ${hybridResult.data.length}개`);
    console.log(`   해상도: ${hybridResult.metadata.resolution}`);
    console.log(`   보간됨: ${hybridResult.metadata.interpolated ? 'Yes' : 'No'}`);
    console.log(`   품질: ${hybridResult.metadata.quality?.qualityScore || 'N/A'}점`);

    // 최적화된 메트릭 조회
    console.log('\n🚀 최적화된 메트릭 조회...');
    const now = new Date();
    const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000);
    
    const optimizedResult = await getOptimizedMetrics(
      sixHoursAgo.toISOString(),
      now.toISOString(),
      2 // 2분 간격
    );

    console.log(`✅ 최적화 결과: ${optimizedResult.data.length}개`);
    console.log(`   기간: ${optimizedResult.timeAnalysis.duration}`);
    console.log(`   커버리지: ${(optimizedResult.timeAnalysis.coverage * 100).toFixed(1)}%`);

    // AI 분석용 메트릭 조회
    console.log('\n🤖 AI 분석용 메트릭 조회...');
    const analyticsResult = await getAnalyticsMetrics('db-01', 1);
    
    console.log(`✅ 분석용 결과: ${analyticsResult.data.length}개`);
    console.log(`   노이즈 레벨: 낮음 (0.5%)`);
    console.log(`   평활화: 강화됨`);

  } catch (error) {
    console.error('❌ Hybrid Bridge 테스트 실패:', error);
  }
};

/**
 * Bridge 고급 기능 테스트
 */
const testAdvancedFeatures = async () => {
  console.log('\n🔬 4. Bridge 고급 기능 테스트');
  console.log('=====================================');

  try {
    const bridge = new HybridMetricsBridge({
      preferInterpolated: true,
      enableCaching: true,
      cacheExpiryMinutes: 5,
      interpolationOptions: {
        resolutionMinutes: 1,
        noiseLevel: 0.01,
        preserveOriginal: true,
        smoothingFactor: 0.15
      }
    });

    // 서버별 상세 조회
    console.log('\n📊 서버별 상세 조회...');
    const serverResult = await bridge.getMetricsByServer('cache-01');
    
    console.log(`✅ 서버 ${serverResult.serverInfo.id}:`);
    console.log(`   데이터 포인트: ${serverResult.serverInfo.totalPoints}개`);
    console.log(`   시간 범위: ${serverResult.serverInfo.timeRange?.start || 'N/A'} ~ ${serverResult.serverInfo.timeRange?.end || 'N/A'}`);
    
    // 상태 분포
    Object.entries(serverResult.serverInfo.statusDistribution).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}개`);
    });

    // 캐시 테스트
    console.log('\n💾 캐시 테스트...');
    const cacheStats1 = bridge.getCacheStats();
    console.log(`   캐시 사이즈 (첫 조회 후): ${cacheStats1.size}개`);

    // 동일한 조회 (캐시에서 반환되어야 함)
    const cachedResult = await bridge.getMetricsByServer('cache-01');
    console.log(`   캐시 적중: ${cachedResult.metadata.cached ? 'Yes' : 'No'}`);

    const cacheStats2 = bridge.getCacheStats();
    console.log(`   캐시 사이즈 (재조회 후): ${cacheStats2.size}개`);

    // 스트리밍 테스트
    console.log('\n🌊 스트리밍 모드 테스트...');
    let batchCount = 0;
    let totalPoints = 0;

    for await (const batch of bridge.streamMetrics('worker-01', 500)) {
      batchCount++;
      totalPoints += batch.length;
      console.log(`   배치 ${batchCount}: ${batch.length}개 데이터`);
      
      if (batchCount >= 3) break; // 최대 3개 배치만 테스트
    }

    console.log(`✅ 스트리밍 완료: ${batchCount}개 배치, 총 ${totalPoints}개 포인트`);

    // 상태 정보
    console.log('\n📋 Bridge 상태:');
    const status = bridge.getStatus();
    console.log(`   준비 상태: ${status.ready ? 'Yes' : 'No'}`);
    console.log(`   캐시 항목: ${status.cache.size}개`);
    console.log(`   해상도: ${status.options.interpolationOptions.resolutionMinutes}분`);

  } catch (error) {
    console.error('❌ 고급 기능 테스트 실패:', error);
  }
};

/**
 * 성능 벤치마크
 */
const testPerformance = async () => {
  console.log('\n🔬 5. 성능 벤치마크');
  console.log('=====================================');

  try {
    // 대용량 데이터 조회
    console.log('\n⏱️ 대용량 데이터 성능 테스트...');
    const largeData = await getMetrics(undefined, undefined, undefined, 1000);
    
    if (largeData.length < 100) {
      console.warn('⚠️ 성능 테스트를 위한 충분한 데이터가 없습니다.');
      return;
    }

    console.log(`📊 테스트 데이터: ${largeData.length}개`);

    // 원본 vs 보간 성능 비교
    const tests = [
      { name: '원본 (보간 없음)', interpolate: false, resolution: 10 },
      { name: '5분 간격 보간', interpolate: true, resolution: 5 },
      { name: '1분 간격 보간', interpolate: true, resolution: 1 }
    ];

    for (const test of tests) {
      const startTime = Date.now();
      
      if (test.interpolate) {
        const result = interpolateMetricsByServer(largeData, {
          resolutionMinutes: test.resolution as 1 | 2 | 5,
          noiseLevel: 0.01,
          preserveOriginal: true
        });
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⚡ ${test.name}: ${duration}ms (${largeData.length} → ${result.length}개)`);
      } else {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        console.log(`⚡ ${test.name}: ${duration}ms (${largeData.length}개)`);
      }
    }

    // 메모리 사용량 추정
    const sampleData = largeData.slice(0, 100);
    const interpolatedSample = interpolateMetrics(sampleData, { resolutionMinutes: 1 });
    
    const originalSize = JSON.stringify(sampleData).length;
    const interpolatedSize = JSON.stringify(interpolatedSample).length;
    const ratio = interpolatedSize / originalSize;
    
    console.log(`\n💾 메모리 사용량 추정:`);
    console.log(`   원본 100개: ${(originalSize / 1024).toFixed(1)}KB`);
    console.log(`   보간 ${interpolatedSample.length}개: ${(interpolatedSize / 1024).toFixed(1)}KB`);
    console.log(`   증가 비율: ${ratio.toFixed(1)}배`);

  } catch (error) {
    console.error('❌ 성능 벤치마크 실패:', error);
  }
};

/**
 * 메인 테스트 실행
 */
const runAllTests = async () => {
  console.log('🧪 시계열 보간 테스트 시작');
  console.log('=====================================');

  // 환경 변수 확인
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
    process.exit(1);
  }

  const startTime = Date.now();

  try {
    await testBasicInterpolation();
    await testServerInterpolation();
    await testHybridBridge();
    await testAdvancedFeatures();
    await testPerformance();

    const endTime = Date.now();
    const totalDuration = endTime - startTime;

    console.log('\n✨ 모든 테스트 완료!');
    console.log(`총 소요 시간: ${totalDuration}ms`);
    console.log('=====================================');

  } catch (error) {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  }
};

// 개별 테스트 실행
const args = process.argv.slice(2);
if (args.includes('--basic')) {
  testBasicInterpolation();
} else if (args.includes('--server')) {
  testServerInterpolation();
} else if (args.includes('--bridge')) {
  testHybridBridge();
} else if (args.includes('--advanced')) {
  testAdvancedFeatures();
} else if (args.includes('--performance')) {
  testPerformance();
} else {
  runAllTests();
} 