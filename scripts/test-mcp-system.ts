#!/usr/bin/env tsx

/**
 * 🧪 MCP 시스템 통합 테스트
 * 
 * ✅ 전체 시스템 컴포넌트 검증
 * ✅ API 엔드포인트 테스트
 * ✅ 성능 벤치마크
 * ✅ 오류 시나리오 테스트
 */

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  totalTime: number;
  successRate: number;
}

class MCPSystemTester {
  private baseUrl: string;
  private results: TestSuite[] = [];

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                   'http://localhost:3001';
  }

  /**
   * 🚀 전체 테스트 실행
   */
  async runAllTests(): Promise<void> {
    console.log('🧪 [MCP-Test] 통합 테스트 시작...');
    console.log(`📍 [MCP-Test] 테스트 대상: ${this.baseUrl}`);
    
    const testSuites = [
      () => this.testSystemHealth(),
      () => this.testUnifiedAI(),
      () => this.testMCPStatus(),
      () => this.testFastAPIIntegration(),
      () => this.testKeepAliveSystem(),
      () => this.testContextManagers(),
      () => this.testErrorHandling(),
      () => this.testPerformance()
    ];

    for (const testSuite of testSuites) {
      try {
        await testSuite();
      } catch (error) {
        console.error('❌ [MCP-Test] 테스트 스위트 실행 실패:', error);
      }
      
      // 테스트 간 간격
      await this.delay(1000);
    }

    this.printSummary();
  }

  /**
   * 🏥 시스템 헬스 체크 테스트
   */
  private async testSystemHealth(): Promise<void> {
    const suite: TestSuite = {
      name: '시스템 헬스 체크',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 기본 헬스 체크
    suite.tests.push(await this.runTest('기본 헬스 체크', async () => {
      const response = await fetch(`${this.baseUrl}/api/health`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!data.status) throw new Error('응답에 status 필드가 없음');
      
      return { status: data.status, timestamp: data.timestamp };
    }));

    // MCP 상태 체크
    suite.tests.push(await this.runTest('MCP 상태 체크', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!data.success) throw new Error('MCP 상태 체크 실패');
      
      return { 
        overall: data.data.overview.overall,
        components: data.data.overview.totalComponents,
        healthy: data.data.overview.healthyComponents
      };
    }));

    // 통합 AI 시스템 상태
    suite.tests.push(await this.runTest('통합 AI 시스템 상태', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/unified?action=health`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return { 
        overall: data.health?.overall,
        fastapi: data.health?.components?.fastapi?.status,
        mcp: data.health?.components?.mcp?.status
      };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 🤖 통합 AI 시스템 테스트
   */
  private async testUnifiedAI(): Promise<void> {
    const suite: TestSuite = {
      name: '통합 AI 시스템',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 기본 질의 테스트
    suite.tests.push(await this.runTest('기본 질의 처리', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: '시스템 상태가 어떤가요?',
          userId: 'test-user',
          sessionId: 'test-session'
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${data.error}`);
      if (!data.answer) throw new Error('응답에 answer 필드가 없음');
      
      return { 
        confidence: data.confidence,
        engine: data.metadata?.engine,
        processingTime: data.metadata?.processingTime
      };
    }));

    // 한국어 NLP 테스트
    suite.tests.push(await this.runTest('한국어 NLP 분석', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: '서버에 문제가 있는 것 같아요. CPU 사용률이 너무 높습니다.',
          options: { includeAnalysis: true }
        })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${data.error}`);
      if (!data.analysis) throw new Error('분석 결과가 없음');
      
      return { 
        sentiment: data.analysis?.sentiment,
        intent: data.analysis?.intent,
        entities: data.analysis?.entities?.length || 0
      };
    }));

    // 시스템 초기화 테스트
    suite.tests.push(await this.runTest('시스템 초기화', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/unified?action=initialize`, {
        method: 'PUT'
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${data.error}`);
      
      return { success: data.success, message: data.message };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 📊 MCP 상태 모니터링 테스트
   */
  private async testMCPStatus(): Promise<void> {
    const suite: TestSuite = {
      name: 'MCP 상태 모니터링',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 전체 상태 조회
    suite.tests.push(await this.runTest('전체 상태 조회', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=overview`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      if (!data.success) throw new Error('상태 조회 실패');
      
      return data.data.overview;
    }));

    // 컴포넌트 상세 조회
    suite.tests.push(await this.runTest('컴포넌트 상세 조회', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=components`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return {
        fastapi: data.data.components?.fastapi?.status,
        mcp: data.data.components?.mcp?.status,
        keepAlive: data.data.components?.keepAlive?.status
      };
    }));

    // 성능 메트릭 조회
    suite.tests.push(await this.runTest('성능 메트릭 조회', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=performance`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return {
        totalQueries: data.data.performance?.totalQueries,
        avgResponseTime: data.data.performance?.avgResponseTime,
        successRate: data.data.performance?.successRate
      };
    }));

    // 시스템 핑 테스트
    suite.tests.push(await this.runTest('시스템 핑', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ping' })
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return { success: data.success, responseTime: data.responseTime };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 🐍 FastAPI 통합 테스트
   */
  private async testFastAPIIntegration(): Promise<void> {
    const suite: TestSuite = {
      name: 'FastAPI 통합',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // FastAPI 연결 테스트
    suite.tests.push(await this.runTest('FastAPI 연결 상태', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=components`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const fastapi = data.data.components?.fastapi;
      if (!fastapi) throw new Error('FastAPI 컴포넌트 정보가 없음');
      
      return { 
        status: fastapi.status,
        latency: fastapi.latency
      };
    }));

    // Python 웜업 테스트
    suite.tests.push(await this.runTest('Python 엔진 웜업', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/python-warmup`, {
        method: 'POST'
      });

      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return { 
        success: data.success,
        warmupTime: data.warmupTime,
        models: data.models
      };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 🔄 Keep-Alive 시스템 테스트
   */
  private async testKeepAliveSystem(): Promise<void> {
    const suite: TestSuite = {
      name: 'Keep-Alive 시스템',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // Keep-Alive 상태 확인
    suite.tests.push(await this.runTest('Keep-Alive 상태', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=components`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const keepAlive = data.data.components?.keepAlive;
      if (!keepAlive) throw new Error('Keep-Alive 컴포넌트 정보가 없음');
      
      return { 
        status: keepAlive.status,
        uptime: keepAlive.uptime
      };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 🧠 컨텍스트 매니저 테스트
   */
  private async testContextManagers(): Promise<void> {
    const suite: TestSuite = {
      name: '컨텍스트 매니저',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 컨텍스트 상태 확인
    suite.tests.push(await this.runTest('컨텍스트 상태', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/mcp-status?view=components`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      const contexts = data.data.components?.contexts;
      if (!contexts) throw new Error('컨텍스트 정보가 없음');
      
      return {
        basic: contexts.basic?.status,
        advanced: contexts.advanced?.status,
        custom: contexts.custom?.status
      };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * ⚠️ 오류 처리 테스트
   */
  private async testErrorHandling(): Promise<void> {
    const suite: TestSuite = {
      name: '오류 처리',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 잘못된 요청 테스트
    suite.tests.push(await this.runTest('잘못된 질의 요청', async () => {
      const response = await fetch(`${this.baseUrl}/api/ai/unified`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}) // 빈 요청
      });

      const data = await response.json();
      
      // 400 에러가 예상됨
      if (response.status !== 400) {
        throw new Error(`예상된 400 에러 대신 ${response.status} 응답`);
      }
      
      return { error: data.error, code: data.code };
    }));

    // 존재하지 않는 엔드포인트
    suite.tests.push(await this.runTest('존재하지 않는 엔드포인트', async () => {
      const response = await fetch(`${this.baseUrl}/api/non-existent-endpoint`);
      
      // 404 에러가 예상됨
      if (response.status !== 404) {
        throw new Error(`예상된 404 에러 대신 ${response.status} 응답`);
      }
      
      return { status: response.status };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * ⚡ 성능 벤치마크 테스트
   */
  private async testPerformance(): Promise<void> {
    const suite: TestSuite = {
      name: '성능 벤치마크',
      tests: [],
      totalTime: 0,
      successRate: 0
    };

    const startTime = Date.now();

    // 동시 요청 테스트
    suite.tests.push(await this.runTest('동시 요청 처리 (5개)', async () => {
      const promises = Array.from({ length: 5 }, (_, i) =>
        fetch(`${this.baseUrl}/api/ai/unified`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: `테스트 질의 ${i + 1}`,
            sessionId: `perf-test-${i}`
          })
        })
      );

      const responses = await Promise.all(promises);
      const results = await Promise.all(
        responses.map(r => r.json())
      );

      const successCount = results.filter(r => r.answer).length;
      const avgTime = results.reduce((sum, r) => 
        sum + (r.metadata?.processingTime || 0), 0) / results.length;

      return { 
        total: 5,
        success: successCount,
        avgProcessingTime: avgTime
      };
    }));

    // 메모리 사용량 테스트
    suite.tests.push(await this.runTest('메모리 사용량 확인', async () => {
      const response = await fetch(`${this.baseUrl}/api/system/status`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      return {
        memoryUsage: data.memory?.usage,
        heapUsed: data.memory?.heapUsed,
        heapTotal: data.memory?.heapTotal
      };
    }));

    suite.totalTime = Date.now() - startTime;
    suite.successRate = this.calculateSuccessRate(suite.tests);
    this.results.push(suite);
  }

  /**
   * 🧪 개별 테스트 실행
   */
  private async runTest(name: string, testFn: () => Promise<any>): Promise<TestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`  🔍 [MCP-Test] ${name}...`);
      const result = await testFn();
      const duration = Date.now() - startTime;
      
      console.log(`    ✅ 성공 (${duration}ms)`);
      return { name, success: true, duration, details: result };
      
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`    ❌ 실패 (${duration}ms): ${error.message}`);
      
      return { 
        name, 
        success: false, 
        duration, 
        error: error.message 
      };
    }
  }

  /**
   * 📊 성공률 계산
   */
  private calculateSuccessRate(tests: TestResult[]): number {
    if (tests.length === 0) return 0;
    const successCount = tests.filter(t => t.success).length;
    return Math.round((successCount / tests.length) * 100);
  }

  /**
   * ⏱️ 지연 함수
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 📋 최종 결과 요약
   */
  private printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📋 [MCP-Test] 통합 테스트 결과 요약');
    console.log('='.repeat(60));

    let totalTests = 0;
    let totalSuccesses = 0;
    let totalTime = 0;

    this.results.forEach(suite => {
      totalTests += suite.tests.length;
      totalSuccesses += suite.tests.filter(t => t.success).length;
      totalTime += suite.totalTime;

      const status = suite.successRate === 100 ? '✅' : 
                    suite.successRate >= 70 ? '⚠️' : '❌';
      
      console.log(`\n${status} ${suite.name}`);
      console.log(`   성공률: ${suite.successRate}% (${suite.tests.filter(t => t.success).length}/${suite.tests.length})`);
      console.log(`   실행시간: ${suite.totalTime}ms`);
      
      // 실패한 테스트 표시
      const failedTests = suite.tests.filter(t => !t.success);
      if (failedTests.length > 0) {
        console.log('   실패한 테스트:');
        failedTests.forEach(test => {
          console.log(`     - ${test.name}: ${test.error}`);
        });
      }
    });

    const overallSuccessRate = Math.round((totalSuccesses / totalTests) * 100);
    const overallStatus = overallSuccessRate === 100 ? '✅' : 
                         overallSuccessRate >= 70 ? '⚠️' : '❌';

    console.log('\n' + '-'.repeat(60));
    console.log(`${overallStatus} 전체 결과`);
    console.log(`   총 테스트: ${totalTests}`);
    console.log(`   성공: ${totalSuccesses}`);
    console.log(`   실패: ${totalTests - totalSuccesses}`);
    console.log(`   전체 성공률: ${overallSuccessRate}%`);
    console.log(`   총 실행시간: ${totalTime}ms`);
    console.log('='.repeat(60));

    // 권장사항
    if (overallSuccessRate < 100) {
      console.log('\n💡 권장사항:');
      if (overallSuccessRate < 70) {
        console.log('   - 시스템에 심각한 문제가 있습니다. 즉시 점검이 필요합니다.');
      } else {
        console.log('   - 일부 기능에 문제가 있습니다. 실패한 테스트를 확인해주세요.');
      }
      console.log('   - 로그를 확인하여 상세한 오류 원인을 파악하세요.');
      console.log('   - 필요시 시스템을 재시작해보세요.');
    } else {
      console.log('\n🎉 모든 테스트가 성공했습니다! MCP 시스템이 정상 작동 중입니다.');
    }
  }
}

// 메인 실행
async function main() {
  const tester = new MCPSystemTester();
  await tester.runAllTests();
}

if (require.main === module) {
  main().catch(console.error);
}

export { MCPSystemTester }; 