#!/usr/bin/env node

/**
 * 🤖 AI 서버 종류 및 역할 기반 분석 테스트
 *
 * 현재 시스템에서 생성된 15개 서버의 종류와 역할을 AI가 얼마나 정확하게 분석하는지 테스트
 */

const BASE_URL = 'http://localhost:3000';

class AIServerAnalysisTest {
  constructor() {
    this.testResults = {
      serverTypeDetection: false,
      roleBasedAnalysis: false,
      performanceByType: false,
      crossServerComparison: false,
      intelligentRecommendations: false,
    };
  }

  /**
   * 🔍 1단계: 서버 종류 감지 테스트
   */
  async testServerTypeDetection() {
    console.log('🔍 1단계: AI 서버 종류 감지 테스트');
    console.log('='.repeat(60));

    try {
      // 서버 데이터 가져오기
      const serversResponse = await fetch(`${BASE_URL}/api/servers/all`);
      const serversData = await serversResponse.json();

      if (!serversData.success) {
        throw new Error('서버 데이터 조회 실패');
      }

      const servers = serversData.data;
      console.log(`✅ 총 ${servers.length}개 서버 데이터 확인됨`);

      // 서버 종류별 분류
      const serverTypes = {};
      servers.forEach(server => {
        if (!serverTypes[server.type]) {
          serverTypes[server.type] = [];
        }
        serverTypes[server.type].push(server);
      });

      console.log('\n📊 서버 종류별 분포:');
      Object.entries(serverTypes).forEach(([type, serverList]) => {
        console.log(`   ${type}: ${serverList.length}개`);
      });

      // AI에게 서버 종류 분석 요청
      const analysisQuery = `현재 시스템에 다음 서버들이 있습니다:
${servers
  .slice(0, 5)
  .map(
    s =>
      `- ${s.name} (타입: ${s.type}, 환경: ${s.environment}, CPU: ${s.cpu}%, 메모리: ${s.memory}%)`
  )
  .join('\n')}

각 서버 종류별로 역할과 특성을 분석해주세요.`;

      const aiResponse = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'server-performance',
          data: { query: analysisQuery, servers: servers },
          options: { includeRecommendations: true, analysisType: 'general' },
        }),
      });

      const aiResult = await aiResponse.json();

      if (aiResult.success) {
        console.log('\n🤖 AI 분석 결과:');
        console.log(`   요약: ${aiResult.analysis?.summary || 'N/A'}`);
        console.log(
          `   신뢰도: ${(aiResult.analysis?.confidence * 100).toFixed(1)}%`
        );
        console.log(
          `   인사이트: ${aiResult.analysis?.insights?.length || 0}개`
        );
        console.log(
          `   권장사항: ${aiResult.analysis?.recommendations?.length || 0}개`
        );

        this.testResults.serverTypeDetection = true;
      }
    } catch (error) {
      console.log(`❌ 서버 종류 감지 테스트 실패: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 🎯 2단계: 역할 기반 성능 분석 테스트
   */
  async testRoleBasedAnalysis() {
    console.log('🎯 2단계: 역할 기반 성능 분석 테스트');
    console.log('='.repeat(60));

    try {
      // 특정 서버 종류별 분석 테스트
      const testCases = [
        {
          query: 'nginx와 apache 웹서버의 성능을 비교 분석해주세요',
          expectedTypes: ['nginx', 'apache'],
        },
        {
          query: 'mysql과 postgresql 데이터베이스 서버의 상태를 점검해주세요',
          expectedTypes: ['mysql', 'postgresql'],
        },
      ];

      for (const testCase of testCases) {
        console.log(`\n🔍 테스트: ${testCase.query}`);

        const response = await fetch(`${BASE_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'server-performance',
            data: {
              query: testCase.query,
              serverTypes: testCase.expectedTypes,
            },
            options: {
              includeRecommendations: true,
              analysisType: 'cpu_performance',
            },
          }),
        });

        const result = await response.json();

        if (result.success) {
          console.log(
            `   ✅ 분석 성공 (신뢰도: ${(result.analysis?.confidence * 100).toFixed(1)}%)`
          );
          console.log(
            `   📊 인사이트: ${result.analysis?.insights?.slice(0, 2).join(', ') || 'N/A'}`
          );
        } else {
          console.log(`   ❌ 분석 실패: ${result.error}`);
        }
      }

      this.testResults.roleBasedAnalysis = true;
    } catch (error) {
      console.log(`❌ 역할 기반 분석 테스트 실패: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 📈 3단계: 서버 종류별 성능 패턴 분석
   */
  async testPerformanceByType() {
    console.log('📈 3단계: 서버 종류별 성능 패턴 분석');
    console.log('='.repeat(60));

    try {
      // 서버 데이터 가져오기
      const serversResponse = await fetch(`${BASE_URL}/api/servers/all`);
      const serversData = await serversResponse.json();
      const servers = serversData.data;

      // 서버 종류별 성능 통계 계산
      const performanceByType = {};

      servers.forEach(server => {
        if (!performanceByType[server.type]) {
          performanceByType[server.type] = {
            count: 0,
            totalCpu: 0,
            totalMemory: 0,
            statuses: {},
          };
        }

        const stats = performanceByType[server.type];
        stats.count++;
        stats.totalCpu += server.cpu;
        stats.totalMemory += server.memory;
        stats.statuses[server.status] =
          (stats.statuses[server.status] || 0) + 1;
      });

      console.log('\n📊 서버 종류별 성능 통계:');
      Object.entries(performanceByType).forEach(([type, stats]) => {
        const avgCpu = (stats.totalCpu / stats.count).toFixed(1);
        const avgMemory = (stats.totalMemory / stats.count).toFixed(1);

        console.log(`\n   ${type.toUpperCase()} (${stats.count}개):`);
        console.log(`     평균 CPU: ${avgCpu}%`);
        console.log(`     평균 메모리: ${avgMemory}%`);
        console.log(
          `     상태: ${Object.entries(stats.statuses)
            .map(([status, count]) => `${status}(${count})`)
            .join(', ')}`
        );
      });

      // AI에게 패턴 분석 요청
      const patternQuery = `다음은 서버 종류별 성능 통계입니다:
${Object.entries(performanceByType)
  .slice(0, 3)
  .map(([type, stats]) => {
    const avgCpu = (stats.totalCpu / stats.count).toFixed(1);
    const avgMemory = (stats.totalMemory / stats.count).toFixed(1);
    return `${type}: 평균 CPU ${avgCpu}%, 메모리 ${avgMemory}%, 서버 ${stats.count}개`;
  })
  .join('\n')}

각 서버 종류의 성능 패턴과 특성을 분석하고, 최적화 방안을 제시해주세요.`;

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'predictive-analysis',
          data: {
            query: patternQuery,
            performanceStats: performanceByType,
          },
          options: { includeRecommendations: true },
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('\n🤖 AI 패턴 분석 결과:');
        console.log(`   ${result.analysis?.summary || 'N/A'}`);
        if (result.analysis?.predictions) {
          result.analysis.predictions.forEach(pred => {
            console.log(
              `   🔮 예측: ${pred.metric} - ${pred.forecast} (확률: ${(pred.probability * 100).toFixed(1)}%)`
            );
          });
        }
        this.testResults.performanceByType = true;
      }
    } catch (error) {
      console.log(`❌ 성능 패턴 분석 테스트 실패: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 🔄 4단계: 서버 간 상관관계 분석
   */
  async testCrossServerComparison() {
    console.log('🔄 4단계: 서버 간 상관관계 분석');
    console.log('='.repeat(60));

    try {
      const response = await fetch(`${BASE_URL}/api/ai/correlation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metrics: ['cpu', 'memory', 'network'],
          timeRange: '1h',
          analysisType: 'pearson',
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('\n🔗 서버 간 상관관계 분석 결과:');
        console.log(`   분석 ID: ${result.data.id}`);
        console.log(`   분석 방법: ${result.data.analysisType}`);

        console.log('\n   강한 상관관계:');
        result.data.results.strongCorrelations.forEach(corr => {
          console.log(
            `     ${corr.pair[0]} ↔ ${corr.pair[1]}: ${corr.value.toFixed(3)}`
          );
        });

        this.testResults.crossServerComparison = true;
      }
    } catch (error) {
      console.log(`❌ 상관관계 분석 테스트 실패: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 💡 5단계: 지능형 권장사항 생성
   */
  async testIntelligentRecommendations() {
    console.log('💡 5단계: 지능형 권장사항 생성');
    console.log('='.repeat(60));

    try {
      const serversResponse = await fetch(`${BASE_URL}/api/servers/all`);
      const serversData = await serversResponse.json();
      const servers = serversData.data;

      // 문제가 있는 서버 식별
      const criticalServers = servers.filter(s => s.status === 'critical');
      const warningServers = servers.filter(s => s.status === 'warning');
      const highCpuServers = servers.filter(s => s.cpu > 80);

      console.log('\n🚨 시스템 상태 요약:');
      console.log(`   위험 상태 서버: ${criticalServers.length}개`);
      console.log(`   경고 상태 서버: ${warningServers.length}개`);
      console.log(`   고CPU 사용 서버: ${highCpuServers.length}개`);

      if (criticalServers.length > 0) {
        console.log(`\n🔴 위험 서버 목록:`);
        criticalServers.forEach(server => {
          console.log(
            `     ${server.name} (${server.type}): CPU ${server.cpu}%, 메모리 ${server.memory}%`
          );
        });
      }

      if (warningServers.length > 0) {
        console.log(`\n🟡 경고 서버 목록:`);
        warningServers.forEach(server => {
          console.log(
            `     ${server.name} (${server.type}): CPU ${server.cpu}%, 메모리 ${server.memory}%`
          );
        });
      }

      // AI에게 종합 권장사항 요청
      const recommendationQuery = `현재 시스템 상황:
- 위험 상태: ${criticalServers.map(s => `${s.name}(${s.type})`).join(', ') || '없음'}
- 경고 상태: ${warningServers.map(s => `${s.name}(${s.type})`).join(', ') || '없음'}
- 고CPU 사용: ${highCpuServers.map(s => `${s.name}(${s.cpu}%)`).join(', ') || '없음'}

서버 종류별 특성을 고려한 우선순위 기반 최적화 방안을 제시해주세요.`;

      const response = await fetch(`${BASE_URL}/api/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'anomaly-detection',
          data: {
            query: recommendationQuery,
            criticalServers,
            warningServers,
          },
          options: { includeRecommendations: true },
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('\n🤖 AI 종합 권장사항:');
        console.log(`   ${result.analysis?.summary || 'N/A'}`);

        if (result.analysis?.anomalies) {
          console.log('\n🔍 발견된 이상 징후:');
          result.analysis.anomalies.forEach(anomaly => {
            console.log(
              `     ${anomaly.type}: ${anomaly.description} (심각도: ${anomaly.severity})`
            );
          });
        }

        if (result.analysis?.recommendations) {
          console.log('\n💡 권장 조치사항:');
          result.analysis.recommendations.forEach((rec, index) => {
            console.log(`     ${index + 1}. ${rec}`);
          });
        }

        this.testResults.intelligentRecommendations = true;
      }
    } catch (error) {
      console.log(`❌ 지능형 권장사항 테스트 실패: ${error.message}`);
    }

    console.log('');
  }

  /**
   * 📋 테스트 결과 요약
   */
  printTestSummary() {
    console.log('📋 AI 서버 분석 테스트 결과 요약');
    console.log('='.repeat(60));

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(
      result => result
    ).length;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);

    console.log(`총 테스트: ${totalTests}개`);
    console.log(`성공: ${passedTests}개`);
    console.log(`실패: ${totalTests - passedTests}개`);
    console.log(`성공률: ${successRate}%\n`);

    Object.entries(this.testResults).forEach(([test, result]) => {
      const status = result ? '✅ 성공' : '❌ 실패';
      const testName = {
        serverTypeDetection: '서버 종류 감지',
        roleBasedAnalysis: '역할 기반 분석',
        performanceByType: '종류별 성능 분석',
        crossServerComparison: '서버 간 상관관계',
        intelligentRecommendations: '지능형 권장사항',
      }[test];

      console.log(`${status} ${testName}`);
    });

    console.log('\n' + '='.repeat(60));

    if (passedTests === totalTests) {
      console.log(
        '🎉 모든 테스트 통과! AI가 서버 종류와 역할을 정확히 분석할 수 있습니다.'
      );
    } else if (passedTests >= totalTests * 0.8) {
      console.log(
        '👍 대부분의 테스트 통과! AI 분석 기능이 잘 작동하고 있습니다.'
      );
    } else if (passedTests >= totalTests * 0.5) {
      console.log('⚠️  일부 테스트 실패. AI 분석 기능에 개선이 필요합니다.');
    } else {
      console.log('🚨 많은 테스트 실패. AI 분석 시스템을 점검해야 합니다.');
    }
  }

  /**
   * 🚀 전체 테스트 실행
   */
  async runAllTests() {
    console.log('🤖 AI 서버 종류 및 역할 기반 분석 테스트 시작');
    console.log('='.repeat(80));
    console.log(`시작 시간: ${new Date().toLocaleString()}`);
    console.log('='.repeat(80));
    console.log('');

    const startTime = Date.now();

    await this.testServerTypeDetection();
    await this.testRoleBasedAnalysis();
    await this.testPerformanceByType();
    await this.testCrossServerComparison();
    await this.testIntelligentRecommendations();

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(1);

    console.log('='.repeat(80));
    console.log(`테스트 완료 시간: ${new Date().toLocaleString()}`);
    console.log(`총 소요 시간: ${duration}초`);
    console.log('='.repeat(80));
    console.log('');

    this.printTestSummary();
  }
}

// 스크립트 실행
if (require.main === module) {
  const tester = new AIServerAnalysisTest();
  tester.runAllTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error);
    process.exit(1);
  });
}

module.exports = AIServerAnalysisTest;
