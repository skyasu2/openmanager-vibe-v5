/**
 * 🧪 AI 사이드바 API 테스트 스크립트
 * Vercel 배포 환경에서 자연어 질의 기능 테스트
 */

const BASE_URL =
  process.env.TEST_URL || 'https://openmanager-vibe-v5.vercel.app';

class AISidebarTester {
  constructor() {
    this.baseUrl = BASE_URL;
    this.testResults = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logMessage);

    this.testResults.push({
      timestamp,
      type,
      message,
    });
  }

  async testAPI(endpoint, method = 'GET', body = null) {
    const url = `${this.baseUrl}${endpoint}`;

    this.log(`Testing ${method} ${url}`);

    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'AI-Sidebar-Tester/1.0',
        },
        timeout: 30000,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);
      const responseTime = Date.now();

      let data;
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (response.ok) {
        this.log(`✅ ${endpoint} - Status: ${response.status}`, 'success');
        return { success: true, data, status: response.status };
      } else {
        this.log(
          `❌ ${endpoint} - Status: ${response.status}, Error: ${JSON.stringify(data)}`,
          'error'
        );
        return { success: false, error: data, status: response.status };
      }
    } catch (error) {
      this.log(`💥 ${endpoint} - 네트워크 오류: ${error.message}`, 'error');
      return { success: false, error: error.message, status: 0 };
    }
  }

  async testAISidebarChain() {
    this.log('🚀 AI 사이드바 기능 테스트 시작', 'info');

    // 1. 기본 헬스체크
    this.log('\n--- 1단계: 기본 헬스체크 ---');
    const healthCheck = await this.testAPI('/api/health');

    if (!healthCheck.success) {
      this.log('💀 기본 헬스체크 실패 - 테스트 중단', 'error');
      return false;
    }

    // 2. Smart Fallback 상태 확인
    this.log('\n--- 2단계: Smart Fallback 엔진 상태 확인 ---');
    const fallbackStatus = await this.testAPI('/api/ai/smart-fallback');

    if (fallbackStatus.success) {
      this.log(
        `📊 Smart Fallback 상태: ${JSON.stringify(fallbackStatus.data, null, 2)}`,
        'info'
      );
    } else {
      this.log('⚠️ Smart Fallback 상태 확인 실패', 'warning');
    }

    // 3. 실제 자연어 질의 테스트
    this.log('\n--- 3단계: 자연어 질의 테스트 ---');

    const testQueries = [
      '현재 서버 상태는 어떤가요?',
      'CPU 사용률이 높은 서버를 찾아주세요',
      '메모리 부족 경고가 있나요?',
    ];

    const queryResults = [];

    for (const query of testQueries) {
      this.log(`🤔 질의: "${query}"`);

      const queryTest = await this.testAPI('/api/ai/smart-fallback', 'POST', {
        query: query,
        engine: 'auto',
        sessionId: `test_${Date.now()}`,
        options: {
          enableThinking: true,
          useCache: false,
        },
      });

      if (queryTest.success) {
        const response = queryTest.data;
        this.log(
          `✅ 응답 성공 - 신뢰도: ${response.metadata?.confidence || 'N/A'}`,
          'success'
        );
        this.log(`📝 응답: ${response.response?.substring(0, 100)}...`, 'info');

        queryResults.push({
          query,
          success: true,
          response: response.response,
          metadata: response.metadata,
        });
      } else {
        this.log(`❌ 질의 실패: ${JSON.stringify(queryTest.error)}`, 'error');
        queryResults.push({
          query,
          success: false,
          error: queryTest.error,
        });
      }

      // 요청 간 대기
      await this.sleep(1000);
    }

    // 4. 관련 API 엔드포인트 테스트
    this.log('\n--- 4단계: 관련 API 엔드포인트 테스트 ---');

    const relatedAPIs = [
      '/api/ai/unified',
      '/api/ai/health',
      '/api/mcp/health',
      '/api/servers',
    ];

    for (const api of relatedAPIs) {
      await this.testAPI(api);
      await this.sleep(500);
    }

    // 5. 테스트 결과 요약
    this.log('\n--- 테스트 결과 요약 ---');

    const successfulQueries = queryResults.filter(r => r.success).length;
    const totalQueries = queryResults.length;

    this.log(
      `📊 자연어 질의 성공률: ${successfulQueries}/${totalQueries} (${((successfulQueries / totalQueries) * 100).toFixed(1)}%)`,
      'info'
    );

    if (successfulQueries === totalQueries) {
      this.log('🎉 모든 AI 사이드바 기능이 정상 동작합니다!', 'success');
      return true;
    } else {
      this.log('⚠️ 일부 AI 사이드바 기능에 문제가 있습니다.', 'warning');

      // 실패한 쿼리 상세 분석
      const failedQueries = queryResults.filter(r => !r.success);
      this.log('\n--- 실패한 질의 분석 ---');
      failedQueries.forEach(failed => {
        this.log(
          `❌ "${failed.query}": ${JSON.stringify(failed.error)}`,
          'error'
        );
      });

      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  generateReport() {
    const report = {
      testUrl: this.baseUrl,
      timestamp: new Date().toISOString(),
      totalTests: this.testResults.length,
      results: this.testResults,
      summary: {
        success: this.testResults.filter(r => r.type === 'success').length,
        error: this.testResults.filter(r => r.type === 'error').length,
        warning: this.testResults.filter(r => r.type === 'warning').length,
        info: this.testResults.filter(r => r.type === 'info').length,
      },
    };

    console.log('\n' + '='.repeat(50));
    console.log('📋 AI 사이드바 테스트 보고서');
    console.log('='.repeat(50));
    console.log(JSON.stringify(report, null, 2));

    return report;
  }
}

// 테스트 실행
async function main() {
  const tester = new AISidebarTester();

  console.log('🧪 AI 사이드바 API 테스트 시작');
  console.log(`🌐 테스트 대상: ${BASE_URL}`);
  console.log('⏰ 시작 시간:', new Date().toISOString());
  console.log('-'.repeat(50));

  try {
    const result = await tester.testAISidebarChain();

    console.log('\n' + '='.repeat(50));
    if (result) {
      console.log('🎯 전체 테스트 성공!');
    } else {
      console.log('⚠️ 일부 테스트 실패 - 문제 해결 필요');
    }

    // 상세 보고서 생성
    tester.generateReport();
  } catch (error) {
    console.error('💥 테스트 실행 중 오류:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행시
if (require.main === module) {
  main().catch(console.error);
}

module.exports = AISidebarTester;
