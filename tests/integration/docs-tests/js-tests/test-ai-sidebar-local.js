/**
 * 🧪 AI 사이드바 로컬 API 테스트 스크립트
 */

const BASE_URL = 'http://localhost:3000';

class LocalAISidebarTester {
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
          'User-Agent': 'AI-Sidebar-Local-Tester/1.0',
        },
        timeout: 30000,
      };

      if (body && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(body);
      }

      const response = await fetch(url, options);

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

  async testLocalAI() {
    this.log('🚀 로컬 AI 사이드바 기능 테스트 시작', 'info');

    // 1. 기본 헬스체크
    this.log('\n--- 1단계: 기본 헬스체크 ---');
    const healthCheck = await this.testAPI('/api/health');

    if (!healthCheck.success) {
      this.log('💀 기본 헬스체크 실패 - 로컬 서버가 실행되지 않음', 'error');
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

    const testQuery = '로컬 테스트: 현재 서버 상태는 어떤가요?';

    this.log(`🤔 질의: "${testQuery}"`);

    const queryTest = await this.testAPI('/api/ai/smart-fallback', 'POST', {
      query: testQuery,
      engine: 'auto',
      sessionId: `local_test_${Date.now()}`,
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
      this.log(`📝 응답: ${response.response?.substring(0, 200)}...`, 'info');
      return true;
    } else {
      this.log(`❌ 질의 실패: ${JSON.stringify(queryTest.error)}`, 'error');
      return false;
    }
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
    console.log('📋 로컬 AI 사이드바 테스트 보고서');
    console.log('='.repeat(50));
    console.log(JSON.stringify(report, null, 2));

    return report;
  }
}

// 테스트 실행
async function main() {
  const tester = new LocalAISidebarTester();

  console.log('🧪 로컬 AI 사이드바 API 테스트 시작');
  console.log(`🌐 테스트 대상: ${BASE_URL}`);
  console.log('⏰ 시작 시간:', new Date().toISOString());
  console.log('-'.repeat(50));

  try {
    const result = await tester.testLocalAI();

    console.log('\n' + '='.repeat(50));
    if (result) {
      console.log('🎯 로컬 테스트 성공!');
      console.log('✅ 로컬에서는 AI 사이드바가 정상 동작합니다.');
      console.log('🔧 Vercel 배포 환경의 문제일 가능성이 높습니다.');
    } else {
      console.log('⚠️ 로컬 테스트 실패');
      console.log('🛠️ 로컬 환경에서도 문제가 있습니다.');
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

module.exports = LocalAISidebarTester;
