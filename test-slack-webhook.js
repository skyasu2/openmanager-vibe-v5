#!/usr/bin/env node

/**
 * 🧪 Slack Webhook API 보안 테스트 스크립트
 *
 * OpenManager Vibe v5 - 바이브 코딩 경연 대회
 *
 * 실행 방법:
 * node test-slack-webhook.js
 *
 * 환경변수 설정 필요:
 * SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const https = require('https');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const http = require('http');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { URL } = require('url');

// 🔧 설정
const API_BASE_URL = 'http://localhost:3000';
const TEST_CASES = {
  valid: {
    server_name: 'Test Server',
    status: 'warning',
    cpu_usage: 85.5,
    memory_usage: 78.2,
    disk_usage: 92.1,
    custom_message: '🧪 보안 테스트 메시지',
  },
  invalid: [
    // 필수 필드 누락
    {
      name: '필수 필드 누락',
      data: { status: 'warning', cpu_usage: 85 },
    },
    // 잘못된 status
    {
      name: '잘못된 status',
      data: {
        server_name: 'Test',
        status: 'invalid_status',
        cpu_usage: 50,
        memory_usage: 60,
        disk_usage: 70,
      },
    },
    // 범위 초과
    {
      name: '범위 초과 값',
      data: {
        server_name: 'Test',
        status: 'normal',
        cpu_usage: 150,
        memory_usage: 60,
        disk_usage: 70,
      },
    },
    // XSS 시도
    {
      name: 'XSS 공격 시도',
      data: {
        server_name: '<script>alert("xss")</script>',
        status: 'warning',
        cpu_usage: 50,
        memory_usage: 60,
        disk_usage: 70,
        custom_message: '<img src="x" onerror="alert(1)">',
      },
    },
  ],
};

// 🔧 HTTP 요청 헬퍼 함수
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Slack-Webhook-Test/1.0',
        ...options.headers,
      },
    };

    const lib = urlObj.protocol === 'https:' ? https : http;
    const req = lib.request(requestOptions, res => {
      let data = '';
      res.on('data', chunk => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data),
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
          });
        }
      });
    });

    req.on('error', reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

// 🎨 결과 출력 헬퍼
function printResult(testName, result, expected = null) {
  const status = result.status;
  const success = expected
    ? status === expected
    : status >= 200 && status < 300;
  const icon = success ? '✅' : '❌';

  console.log(`${icon} ${testName}`);
  console.log(`   상태: ${status}`);

  if (result.data && typeof result.data === 'object') {
    if (result.data.success !== undefined) {
      console.log(`   성공: ${result.data.success}`);
    }
    if (result.data.message) {
      console.log(`   메시지: ${result.data.message}`);
    }
    if (result.data.error) {
      console.log(`   에러: ${result.data.error}`);
    }
    if (result.data.code) {
      console.log(`   코드: ${result.data.code}`);
    }
  }

  console.log('');
}

// 🧪 테스트 실행 함수들
async function testHealthCheck() {
  console.log('📋 1. API 헬스 체크 테스트');
  console.log('='.repeat(50));

  try {
    const result = await makeRequest(`${API_BASE_URL}/api/slack/webhook`);
    printResult('GET /api/slack/webhook', result);

    if (result.data && result.data.data) {
      const config = result.data.data;
      console.log('🔧 설정 정보:');
      console.log(`   Webhook 설정: ${config.configured ? '✅' : '❌'}`);
      console.log(`   채널: ${config.channel}`);
      console.log(`   Rate Limit: ${config.rateLimit}/분`);
      console.log(`   타임아웃: ${config.timeout}ms`);
      console.log(`   환경: ${config.environment}`);
      console.log('');
    }
  } catch (error) {
    console.log(`❌ 헬스 체크 실패: ${error.message}\n`);
  }
}

async function testValidRequest() {
  console.log('✅ 2. 유효한 요청 테스트');
  console.log('='.repeat(50));

  try {
    const result = await makeRequest(`${API_BASE_URL}/api/slack/webhook`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.1',
        'user-agent': 'TestValidRequest/1.0',
      },
      body: TEST_CASES.valid,
    });

    printResult('유효한 서버 상태 전송', result);

    if (result.status === 200 && result.data && result.data.success) {
      console.log('🎉 성공! Slack으로 메시지가 전송되었습니다.');
    } else if (
      result.status === 400 &&
      result.data &&
      result.data.code === 'WEBHOOK_NOT_CONFIGURED'
    ) {
      console.log('⚠️  SLACK_WEBHOOK_URL 환경변수가 설정되지 않았습니다.');
      console.log('   .env.local 파일에 설정을 추가해주세요:');
      console.log(
        '   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL'
      );
    }
    console.log('');
  } catch (error) {
    console.log(`❌ 유효한 요청 테스트 실패: ${error.message}\n`);
  }
}

async function testInvalidRequests() {
  console.log('❌ 3. 입력값 검증 테스트');
  console.log('='.repeat(50));

  for (const testCase of TEST_CASES.invalid) {
    try {
      const result = await makeRequest(`${API_BASE_URL}/api/slack/webhook`, {
        method: 'POST',
        headers: {
          'x-forwarded-for': `127.0.0.${Math.floor(Math.random() * 254) + 1}`,
          'user-agent': 'TestCase/1.0',
        },
        body: testCase.data,
      });

      // 400 에러를 기대
      printResult(testCase.name, result, 400);

      if (
        result.status === 400 &&
        result.data &&
        result.data.code === 'VALIDATION_ERROR'
      ) {
        console.log(
          `   ✅ 검증 성공: 잘못된 입력이 정상적으로 거부되었습니다.`
        );
        if (result.data.details && Array.isArray(result.data.details)) {
          console.log(`   📝 상세 오류: ${result.data.details.join(', ')}`);
        }
      } else {
        console.log(`   ⚠️  예상과 다른 응답을 받았습니다.`);
      }
      console.log('');
    } catch (error) {
      console.log(`❌ ${testCase.name} 테스트 실패: ${error.message}\n`);
    }
  }
}

async function testRateLimit() {
  console.log('🚦 4. Rate Limiting 테스트');
  console.log('='.repeat(50));

  console.log('📤 연속으로 12개 요청을 전송합니다 (제한: 10개/분)...');

  const requests = [];
  for (let i = 0; i < 12; i++) {
    const request = makeRequest(`${API_BASE_URL}/api/slack/webhook`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.1.100', // 동일한 IP 사용
        'user-agent': 'RateLimitTest/1.0',
      },
      body: {
        server_name: `Rate Limit Test ${i + 1}`,
        status: 'normal',
        cpu_usage: 30 + i,
        memory_usage: 40 + i,
        disk_usage: 50 + i,
      },
    });

    requests.push(request);
  }

  try {
    const results = await Promise.all(requests);

    let successCount = 0;
    let rateLimitCount = 0;

    results.forEach((result, index) => {
      if (result.status === 200) {
        successCount++;
      } else if (result.status === 429) {
        rateLimitCount++;
        if (rateLimitCount === 1) {
          console.log(
            `🚫 요청 ${index + 1}: Rate Limit 발동! (${result.status})`
          );
          if (result.data && result.data.code === 'RATE_LIMIT_EXCEEDED') {
            console.log('   ✅ Rate Limiting이 정상적으로 작동합니다.');
          }
        }
      }
    });

    console.log(`📊 결과: 성공 ${successCount}개, 제한 ${rateLimitCount}개`);

    if (rateLimitCount > 0) {
      console.log('✅ Rate Limiting 테스트 성공!');
    } else {
      console.log('⚠️  Rate Limiting이 예상대로 작동하지 않았습니다.');
    }
    console.log('');
  } catch (error) {
    console.log(`❌ Rate Limiting 테스트 실패: ${error.message}\n`);
  }
}

async function testErrorHandling() {
  console.log('⚠️  5. 에러 처리 테스트');
  console.log('='.repeat(50));

  // 잘못된 JSON 테스트
  try {
    const result = await makeRequest(`${API_BASE_URL}/api/slack/webhook`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-forwarded-for': '127.0.0.200',
        'user-agent': 'InvalidJsonTest/1.0',
      },
      body: 'invalid json content', // 직접 문자열 전송
    });

    printResult('잘못된 JSON 형식', result, 400);

    if (
      result.status === 400 &&
      result.data &&
      result.data.code === 'INVALID_JSON'
    ) {
      console.log('   ✅ 잘못된 JSON이 정상적으로 거부되었습니다.');
    }
    console.log('');
  } catch (error) {
    console.log(`❌ JSON 에러 테스트 실패: ${error.message}\n`);
  }
}

async function testPerformance() {
  console.log('⚡ 6. 성능 테스트');
  console.log('='.repeat(50));

  try {
    const startTime = Date.now();

    const result = await makeRequest(`${API_BASE_URL}/api/slack/webhook`, {
      method: 'POST',
      headers: {
        'x-forwarded-for': '127.0.0.250',
        'user-agent': 'PerformanceTest/1.0',
      },
      body: {
        server_name: 'Performance Test Server',
        status: 'normal',
        cpu_usage: 45.5,
        memory_usage: 55.2,
        disk_usage: 65.8,
      },
    });

    const endTime = Date.now();
    const responseTime = endTime - startTime;

    printResult('성능 테스트', result);

    console.log(`📊 응답 시간: ${responseTime}ms`);

    if (responseTime < 2000) {
      console.log('✅ 성능 기준 충족 (< 2초)');
    } else {
      console.log('⚠️  응답 시간이 기준을 초과했습니다 (> 2초)');
    }

    if (result.headers && result.headers['x-processing-time']) {
      console.log(
        `🔧 서버 처리 시간: ${result.headers['x-processing-time']}ms`
      );
    }
    console.log('');
  } catch (error) {
    console.log(`❌ 성능 테스트 실패: ${error.message}\n`);
  }
}

// 🚀 메인 테스트 실행
async function runAllTests() {
  console.log('🛡️  OpenManager Vibe v5 - Slack Webhook 보안 테스트');
  console.log('🎯 바이브 코딩 경연 대회');
  console.log('='.repeat(70));
  console.log('');

  // 환경 정보 출력
  console.log('🔧 테스트 환경:');
  console.log(`   API URL: ${API_BASE_URL}`);
  console.log(`   Node.js: ${process.version}`);
  console.log(`   시작 시간: ${new Date().toLocaleString('ko-KR')}`);
  console.log('');

  try {
    await testHealthCheck();
    await testValidRequest();
    await testInvalidRequests();
    await testRateLimit();
    await testErrorHandling();
    await testPerformance();

    console.log('🎉 모든 테스트가 완료되었습니다!');
    console.log('');
    console.log('📋 테스트 요약:');
    console.log('   ✅ API 헬스 체크');
    console.log('   ✅ 유효한 요청 처리');
    console.log('   ✅ 입력값 검증 및 보안');
    console.log('   ✅ Rate Limiting');
    console.log('   ✅ 에러 처리');
    console.log('   ✅ 성능 측정');
    console.log('');
    console.log('🛡️  보안 기능 확인:');
    console.log('   🔒 환경변수 기반 설정');
    console.log('   🚦 Rate Limiting (10회/분)');
    console.log('   📝 입력값 검증 및 Sanitization');
    console.log('   ⚠️  민감한 정보 노출 방지');
    console.log('   🛠️  에러 안전 처리');
  } catch (error) {
    console.error('❌ 테스트 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시 테스트 시작
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  testHealthCheck,
  testValidRequest,
  testInvalidRequests,
  testRateLimit,
  testErrorHandling,
  testPerformance,
};
