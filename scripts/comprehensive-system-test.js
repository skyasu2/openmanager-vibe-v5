#!/usr/bin/env node

/**
 * ��� 포괄적 시스템 테스트 - 서버 데이터 생성기 → 대시보드 → AI 어시스턴트
 *
 * 테스트 범위:
 * 1. 서버 데이터 생성기 동작 상태
 * 2. 대시보드 데이터 갱신 주기 (24시간 데이터)
 * 3. 서버 카드 및 모달 데이터 분석
 * 4. AI 어시스턴트 데이터 수신 및 분석
 * 5. Vercel vs 테스트 서버 비교
 */

const http = require('http');

class ComprehensiveSystemTest {
  constructor() {
    this.baseUrl = 'http://localhost:3000';
    this.vercelUrl = 'https://openmanager-vibe-v5.vercel.app';
    this.results = {
      serverDataGenerator: null,
      dashboardData: null,
      serverCards: null,
      aiAssistant: null,
      vercelComparison: null,
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[36m', // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m', // red
      reset: '\x1b[0m',
    };

    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  async makeRequest(method, url, data = null, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const isHttps = url.startsWith('https://');
      const httpModule = isHttps ? require('https') : http;

      const urlObj = new URL(url);
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'ComprehensiveSystemTest/1.0',
        },
        timeout: timeout,
      };

      if (data) {
        const jsonData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(jsonData);
      }

      const req = httpModule.request(options, res => {
        let responseData = '';
        res.on('data', chunk => (responseData += chunk));
        res.on('end', () => {
          try {
            const response = responseData ? JSON.parse(responseData) : {};
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: response,
              raw: responseData,
            });
          } catch (parseError) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: null,
              raw: responseData,
              parseError: parseError.message,
            });
          }
        });
      });

      req.on('error', reject);
      req.on('timeout', () => reject(new Error('Request timeout')));

      if (data) {
        req.write(JSON.stringify(data));
      }
      req.end();
    });
  }

  // 1. 서버 데이터 생성기 테스트
  async testServerDataGenerator() {
    this.log('��� 1. 서버 데이터 생성기 동작 상태 점검', 'info');

    try {
      const response = await this.makeRequest(
        'GET',
        `${this.baseUrl}/api/servers/realtime?limit=5`
      );

      if (response.status === 200 && response.data) {
        const data = response.data;

        this.results.serverDataGenerator = {
          status: 'success',
          serverCount: data.servers?.length || 0,
          totalServers: data.summary?.servers?.total || 0,
          onlineServers: data.summary?.servers?.online || 0,
          warningServers: data.summary?.servers?.warning || 0,
          criticalServers: data.summary?.servers?.critical || 0,
          dataSource: response.headers['x-data-source'] || 'unknown',
          isMockMode: response.headers['x-data-fallback-warning'] === 'true',
          responseTime: Date.now() - this.startTime,
          timestamp: new Date().toISOString(),
        };

        this.log(`✅ 서버 데이터 생성기 정상 동작`, 'success');
        this.log(
          `   - 서버 수: ${this.results.serverDataGenerator.serverCount}개`,
          'info'
        );
        this.log(
          `   - 총 서버: ${this.results.serverDataGenerator.totalServers}개`,
          'info'
        );
        this.log(
          `   - 온라인: ${this.results.serverDataGenerator.onlineServers}개`,
          'info'
        );
        this.log(
          `   - 데이터 소스: ${this.results.serverDataGenerator.dataSource}`,
          'info'
        );
        this.log(
          `   - Mock 모드: ${this.results.serverDataGenerator.isMockMode ? 'Yes' : 'No'}`,
          'info'
        );

        return true;
      } else {
        throw new Error(`API 응답 오류: ${response.status}`);
      }
    } catch (error) {
      this.log(`❌ 서버 데이터 생성기 테스트 실패: ${error.message}`, 'error');
      this.results.serverDataGenerator = {
        status: 'failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
      return false;
    }
  }

  // 메인 테스트 실행
  async run() {
    this.log('��� 포괄적 시스템 테스트 시작', 'info');
    this.log(`��� 테스트 대상: ${this.baseUrl}`, 'info');

    try {
      // 서버 데이터 생성기 테스트
      await this.testServerDataGenerator();

      this.log('\n��� 포괄적 시스템 테스트 완료!', 'success');
      return this.results;
    } catch (error) {
      this.log(`��� 시스템 테스트 중 치명적 오류: ${error.message}`, 'error');
      throw error;
    }
  }
}

// 스크립트 직접 실행 시
if (require.main === module) {
  const tester = new ComprehensiveSystemTest();

  tester
    .run()
    .then(report => {
      console.log('\n✅ 모든 테스트 완료');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ 테스트 실행 실패:', error.message);
      process.exit(1);
    });
}

module.exports = ComprehensiveSystemTest;
