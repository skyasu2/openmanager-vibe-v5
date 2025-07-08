/**
 * 🧪 데이터 흐름 통합 테스트 스크립트
 *
 * 프론트엔드 시작버튼 → 서버 데이터 생성 → AI 분석 → 프론트엔드 수신
 * 전체 과정을 단계별로 테스트하고 성능을 측정합니다.
 */

const BASE_URL = 'http://localhost:3001';

// 🎯 테스트 단계별 함수들
const testSteps = {
  // 1단계: 시스템 헬스체크
  async testSystemHealth() {
    console.log('\n🏥 1단계: 시스템 헬스체크');
    const start = Date.now();

    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      const data = await response.json();
      const duration = Date.now() - start;

      console.log(`✅ 헬스체크 완료 (${duration}ms)`);
      console.log(`📊 전체 상태: ${data.status}`);
      console.log(`🔧 데이터 생성기: ${data.checks.generator.status}`);
      console.log(`💾 Redis: ${data.checks.redis.status}`);

      return {
        success: data.status !== 'critical',
        duration,
        details: data.checks,
      };
    } catch (error) {
      console.error('❌ 헬스체크 실패:', error.message);
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },

  // 2단계: 서버 데이터 생성 확인
  async testServerDataGeneration() {
    console.log('\n🏗️ 2단계: 서버 데이터 생성 확인');
    const start = Date.now();

    try {
      const response = await fetch(`${BASE_URL}/api/servers`);
      const data = await response.json();
      const duration = Date.now() - start;

      console.log(`✅ 서버 데이터 수신 완료 (${duration}ms)`);
      console.log(`📊 총 서버: ${data.total}개`);
      console.log(`📋 표시 서버: ${data.displayed}개`);
      console.log(`📈 상태 분포:`, data.distribution);

      // 데이터 품질 검증
      const qualityCheck = {
        hasServers: data.servers && data.servers.length > 0,
        hasStats: data.stats && typeof data.stats.total === 'number',
        hasDistribution:
          data.distribution && typeof data.distribution.online === 'number',
        serversValid: data.servers?.every(s => s.id && s.name && s.status),
      };

      console.log('🔍 데이터 품질:', qualityCheck);

      return {
        success: data.success && qualityCheck.hasServers,
        duration,
        serverCount: data.total,
        displayedCount: data.displayed,
        distribution: data.distribution,
        quality: qualityCheck,
      };
    } catch (error) {
      console.error('❌ 서버 데이터 생성 실패:', error.message);
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },

  // 3단계: AI 예측 시스템 테스트
  async testAIPrediction() {
    console.log('\n🔮 3단계: AI 예측 시스템 테스트');
    const start = Date.now();

    try {
      const response = await fetch(
        `${BASE_URL}/api/ai/predict?serverId=server-1&timeframe=60`
      );
      const data = await response.json();
      const duration = Date.now() - start;

      console.log(`✅ AI 예측 완료 (${duration}ms)`);
      console.log(`🤖 AI 엔진: ${data.meta?.engine}`);
      console.log(`📊 예측 모델: ${data.data?.metadata?.model_used}`);
      console.log(
        `🎯 신뢰도: ${(data.data?.predictions?.confidence * 100).toFixed(1)}%`
      );
      console.log(`📈 트렌드: ${data.data?.predictions?.trend}`);

      // AI 데이터 품질 검증
      const aiQuality = {
        hasPredictions: data.data?.predictions?.values?.length > 0,
        hasTimestamps: data.data?.predictions?.timestamps?.length > 0,
        hasRecommendations: data.data?.recommendations?.length > 0,
        hasInsights:
          data.data?.insights &&
          typeof data.data.insights.average_load === 'number',
      };

      console.log('🧠 AI 품질:', aiQuality);

      return {
        success: data.success && aiQuality.hasPredictions,
        duration,
        engine: data.meta?.engine,
        model: data.data?.metadata?.model_used,
        confidence: data.data?.predictions?.confidence,
        predictionCount: data.data?.predictions?.values?.length,
        quality: aiQuality,
      };
    } catch (error) {
      console.error('❌ AI 예측 실패:', error.message);
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },

  // 4단계: AI 추천 시스템 테스트
  async testAIRecommendations() {
    console.log('\n💡 4단계: AI 추천 시스템 테스트');
    const start = Date.now();

    try {
      const response = await fetch(`${BASE_URL}/api/ai/recommendations`);
      const data = await response.json();
      const duration = Date.now() - start;

      console.log(`✅ AI 추천 완료 (${duration}ms)`);
      console.log(`🎯 총 추천사항: ${data.recommendations?.length}개`);
      console.log(`🔴 높은 우선순위: ${data.analytics?.highPriority}개`);
      console.log(`🟡 중간 우선순위: ${data.analytics?.mediumPriority}개`);
      console.log(`🟢 낮은 우선순위: ${data.analytics?.lowPriority}개`);

      // 추천사항 품질 검증
      const recQuality = {
        hasRecommendations:
          data.recommendations && data.recommendations.length > 0,
        hasAnalytics:
          data.analytics &&
          typeof data.analytics.totalRecommendations === 'number',
        validRecommendations: data.recommendations?.every(
          r => r.id && r.title && r.priority
        ),
      };

      console.log('💡 추천 품질:', recQuality);

      return {
        success: data.success && recQuality.hasRecommendations,
        duration,
        totalRecommendations: data.recommendations?.length,
        analytics: data.analytics,
        quality: recQuality,
      };
    } catch (error) {
      console.error('❌ AI 추천 실패:', error.message);
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },

  // 5단계: 통합 대시보드 데이터 테스트
  async testDashboardIntegration() {
    console.log('\n📊 5단계: 통합 대시보드 데이터 테스트');
    const start = Date.now();

    try {
      const response = await fetch(`${BASE_URL}/api/dashboard`);
      const data = await response.json();
      const duration = Date.now() - start;

      console.log(`✅ 대시보드 데이터 완료 (${duration}ms)`);
      console.log(`🏗️ 서버 아키텍처: ${data.architecture}`);
      console.log(`📊 서버 수: ${data.servers?.length}개`);
      console.log(
        `📈 평균 CPU: ${data.summary?.performance?.avgCpu?.toFixed(1)}%`
      );
      console.log(
        `💾 평균 메모리: ${data.summary?.performance?.avgMemory?.toFixed(1)}%`
      );

      // 대시보드 데이터 품질 검증
      const dashQuality = {
        hasServers: data.servers && data.servers.length > 0,
        hasSummary: data.summary && typeof data.summary.overview === 'object',
        hasPerformance:
          data.summary?.performance &&
          typeof data.summary.performance.avgCpu === 'number',
        hasHealth:
          data.summary?.health &&
          typeof data.summary.health.averageScore === 'number',
      };

      console.log('📊 대시보드 품질:', dashQuality);

      return {
        success: data.success && dashQuality.hasServers,
        duration,
        serverCount: data.servers?.length,
        architecture: data.architecture,
        summary: data.summary,
        quality: dashQuality,
      };
    } catch (error) {
      console.error('❌ 대시보드 데이터 실패:', error.message);
      return {
        success: false,
        duration: Date.now() - start,
        error: error.message,
      };
    }
  },
};

// 🚀 메인 테스트 실행 함수
async function runDataFlowTest() {
  console.log('🧪 ====== 데이터 흐름 통합 테스트 시작 ======');
  console.log(`🌐 테스트 대상: ${BASE_URL}`);
  console.log(`⏰ 시작 시간: ${new Date().toLocaleString()}`);

  const results = {};
  const totalStart = Date.now();

  // 모든 테스트 단계 실행
  for (const [stepName, testFunc] of Object.entries(testSteps)) {
    try {
      results[stepName] = await testFunc();

      // 단계별 1초 대기 (시스템 안정화)
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ ${stepName} 실행 중 오류:`, error);
      results[stepName] = { success: false, error: error.message };
    }
  }

  const totalDuration = Date.now() - totalStart;

  // 🎯 최종 결과 분석
  console.log('\n📋 ====== 테스트 결과 요약 ======');

  const successCount = Object.values(results).filter(r => r.success).length;
  const totalCount = Object.keys(results).length;
  const successRate = ((successCount / totalCount) * 100).toFixed(1);

  console.log(`✅ 성공률: ${successCount}/${totalCount} (${successRate}%)`);
  console.log(`⏱️ 총 소요시간: ${totalDuration}ms`);

  // 단계별 상세 결과
  Object.entries(results).forEach(([step, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${step}: ${result.duration}ms`);
    if (result.error) {
      console.log(`   🚨 오류: ${result.error}`);
    }
  });

  // 🔍 성능 분석
  console.log('\n⚡ ====== 성능 분석 ======');
  const avgDuration =
    Object.values(results)
      .filter(r => r.duration)
      .reduce((sum, r) => sum + r.duration, 0) / totalCount;

  console.log(`📊 평균 응답시간: ${avgDuration.toFixed(1)}ms`);
  console.log(
    `🚀 가장 빠른 단계: ${Math.min(...Object.values(results).map(r => r.duration || Infinity))}ms`
  );
  console.log(
    `🐌 가장 느린 단계: ${Math.max(...Object.values(results).map(r => r.duration || 0))}ms`
  );

  // 🎯 개선점 제안
  console.log('\n🔧 ====== 개선점 제안 ======');

  if (results.testSystemHealth?.duration > 3000) {
    console.log('⚠️ 헬스체크 응답시간이 느립니다 (3초 초과)');
  }

  if (results.testServerDataGeneration?.serverCount < 10) {
    console.log('⚠️ 서버 데이터 개수가 적습니다 (10개 미만)');
  }

  if (results.testAIPrediction?.confidence < 0.7) {
    console.log('⚠️ AI 예측 신뢰도가 낮습니다 (70% 미만)');
  }

  if (results.testAIRecommendations?.totalRecommendations < 3) {
    console.log('⚠️ AI 추천사항이 부족합니다 (3개 미만)');
  }

  if (successRate < 100) {
    console.log('🚨 일부 테스트 실패 - 시스템 점검 필요');
  } else {
    console.log('🎉 모든 테스트 통과 - 시스템 정상 동작');
  }

  console.log('\n🏁 ====== 테스트 완료 ======');

  return {
    success: successRate >= 80, // 80% 이상 성공 시 전체 성공
    successRate: parseFloat(successRate),
    totalDuration,
    avgDuration,
    results,
  };
}

// 스크립트 실행
if (require.main === module) {
  runDataFlowTest()
    .then(result => {
      console.log(`\n🎯 최종 결과: ${result.success ? '성공' : '실패'}`);
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 테스트 실행 중 치명적 오류:', error);
      process.exit(1);
    });
}

module.exports = { runDataFlowTest, testSteps };
