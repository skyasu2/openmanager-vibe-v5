#!/usr/bin/env node

/**
 * 🚀 OpenManager Vibe v5 프로덕션 성능 종합 테스트
 *
 * 베르셀 프로덕션 환경에서 시스템 전체 성능을 종합적으로 테스트합니다.
 */

const BYPASS_SECRET = 'ee2aGggamAVy7ti2iycFOXamwgjIhuhr';
const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

// 테스트할 API 엔드포인트들
const TEST_ENDPOINTS = [
  {
    name: 'Health Check',
    url: '/api/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
  },
  {
    name: 'Server List (20개)',
    url: '/api/servers?limit=20',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    name: 'Realtime Summary',
    url: '/api/servers/realtime?type=summary',
    method: 'GET',
    expectedStatus: 200,
    timeout: 8000,
  },
  {
    name: 'Realtime Servers',
    url: '/api/servers/realtime?type=servers',
    method: 'GET',
    expectedStatus: 200,
    timeout: 8000,
  },
  {
    name: 'AI Engines Status',
    url: '/api/ai/engines/status',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
  },
  {
    name: 'System Status',
    url: '/api/status',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
  },
  {
    name: 'Logs (10개)',
    url: '/api/logs?limit=10',
    method: 'GET',
    expectedStatus: 200,
    timeout: 8000,
  },
  {
    name: 'AI Integrated Query',
    url: '/api/ai-agent/integrated',
    method: 'POST',
    body: { query: '시스템 상태 요약', category: 'monitoring' },
    expectedStatus: 200,
    timeout: 15000,
  },
];

async function testEndpoint(endpoint) {
  const startTime = Date.now();

  try {
    const options = {
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': BYPASS_SECRET,
        'x-vercel-set-bypass-cookie': 'true',
        'User-Agent': 'OpenManager-Performance-Test/1.0',
      },
      signal: AbortSignal.timeout(endpoint.timeout),
    };

    if (endpoint.body) {
      options.body = JSON.stringify(endpoint.body);
    }

    const response = await fetch(`${BASE_URL}${endpoint.url}`, options);
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    const success = response.status === endpoint.expectedStatus;

    let dataSize = 0;
    let dataType = 'unknown';

    try {
      const data = await response.json();
      dataSize = JSON.stringify(data).length;
      dataType = typeof data;
    } catch (e) {
      // JSON 파싱 실패 시 텍스트로 처리
      const text = await response.text();
      dataSize = text.length;
      dataType = 'text';
    }

    return {
      name: endpoint.name,
      success,
      status: response.status,
      responseTime,
      dataSize,
      dataType,
      error: null,
    };
  } catch (error) {
    const endTime = Date.now();
    const responseTime = endTime - startTime;

    return {
      name: endpoint.name,
      success: false,
      status: 0,
      responseTime,
      dataSize: 0,
      dataType: 'error',
      error: error.message,
    };
  }
}

async function runPerformanceTest() {
  console.log('🚀 OpenManager Vibe v5 프로덕션 성능 테스트 시작');
  console.log(`🌐 베이스 URL: ${BASE_URL}`);
  console.log(`🔑 Protection Bypass: 활성화`);
  console.log(`📊 테스트 엔드포인트: ${TEST_ENDPOINTS.length}개\n`);

  const results = [];
  let totalResponseTime = 0;
  let successCount = 0;
  let totalDataSize = 0;

  // 순차적으로 테스트 실행
  for (let i = 0; i < TEST_ENDPOINTS.length; i++) {
    const endpoint = TEST_ENDPOINTS[i];
    console.log(
      `🔍 [${i + 1}/${TEST_ENDPOINTS.length}] ${endpoint.name} 테스트 중...`
    );

    const result = await testEndpoint(endpoint);
    results.push(result);

    if (result.success) {
      console.log(
        `   ✅ 성공 (${result.responseTime}ms, ${result.dataSize} bytes)`
      );
      successCount++;
      totalResponseTime += result.responseTime;
      totalDataSize += result.dataSize;
    } else {
      console.log(`   ❌ 실패 (${result.status}, ${result.responseTime}ms)`);
      if (result.error) {
        console.log(`      오류: ${result.error}`);
      }
    }

    // API 부하 방지를 위한 짧은 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // 결과 분석
  console.log('\n📊 성능 테스트 결과 분석');
  console.log('='.repeat(60));

  const avgResponseTime =
    successCount > 0 ? Math.round(totalResponseTime / successCount) : 0;
  const successRate = Math.round((successCount / TEST_ENDPOINTS.length) * 100);
  const totalDataMB = (totalDataSize / 1024 / 1024).toFixed(2);

  console.log(
    `📈 전체 성공률: ${successRate}% (${successCount}/${TEST_ENDPOINTS.length})`
  );
  console.log(`⚡ 평균 응답시간: ${avgResponseTime}ms`);
  console.log(`📦 총 데이터 전송량: ${totalDataMB}MB`);
  console.log(
    `🎯 시스템 건강도: ${successRate >= 95 ? '🟢 우수' : successRate >= 80 ? '🟡 양호' : '🔴 주의'}`
  );

  // 상세 결과 테이블
  console.log('\n📋 상세 테스트 결과:');
  console.log('─'.repeat(80));
  console.log(
    'API 엔드포인트'.padEnd(25) +
      '상태'.padEnd(8) +
      '응답시간'.padEnd(10) +
      '데이터크기'.padEnd(12) +
      '비고'
  );
  console.log('─'.repeat(80));

  results.forEach(result => {
    const status = result.success ? '✅ 성공' : '❌ 실패';
    const responseTime = `${result.responseTime}ms`;
    const dataSize = result.success
      ? `${(result.dataSize / 1024).toFixed(1)}KB`
      : '-';
    const note = result.error ? result.error.substring(0, 20) + '...' : '';

    console.log(
      result.name.padEnd(25) +
        status.padEnd(8) +
        responseTime.padEnd(10) +
        dataSize.padEnd(12) +
        note
    );
  });

  // 성능 등급 평가
  console.log('\n🏆 성능 등급 평가:');
  console.log('─'.repeat(40));

  const performanceGrade = getPerformanceGrade(successRate, avgResponseTime);
  console.log(
    `📊 종합 등급: ${performanceGrade.grade} (${performanceGrade.score}점)`
  );
  console.log(`💬 평가: ${performanceGrade.comment}`);

  // 권장사항
  if (successRate < 100) {
    console.log('\n⚠️ 개선 권장사항:');
    results
      .filter(r => !r.success)
      .forEach(result => {
        console.log(
          `   • ${result.name}: ${result.error || '상태 코드 ' + result.status}`
        );
      });
  }

  if (avgResponseTime > 1000) {
    console.log('\n🐌 성능 최적화 권장:');
    console.log('   • 응답시간이 1초를 초과하는 API가 있습니다');
    console.log('   • 캐싱 전략 검토를 권장합니다');
  }

  return {
    successRate,
    avgResponseTime,
    totalDataSize,
    results,
    grade: performanceGrade,
  };
}

function getPerformanceGrade(successRate, avgResponseTime) {
  let score = 0;

  // 성공률 점수 (60점 만점)
  if (successRate >= 100) score += 60;
  else if (successRate >= 95) score += 50;
  else if (successRate >= 90) score += 40;
  else if (successRate >= 80) score += 30;
  else score += 20;

  // 응답시간 점수 (40점 만점)
  if (avgResponseTime <= 100) score += 40;
  else if (avgResponseTime <= 300) score += 35;
  else if (avgResponseTime <= 500) score += 30;
  else if (avgResponseTime <= 1000) score += 25;
  else if (avgResponseTime <= 2000) score += 15;
  else score += 5;

  let grade, comment;

  if (score >= 95) {
    grade = '🥇 S급 (최우수)';
    comment = '프로덕션 환경에서 완벽한 성능을 보여줍니다';
  } else if (score >= 85) {
    grade = '🥈 A급 (우수)';
    comment = '프로덕션 환경에서 우수한 성능을 보여줍니다';
  } else if (score >= 75) {
    grade = '🥉 B급 (양호)';
    comment = '프로덕션 환경에서 양호한 성능을 보여줍니다';
  } else if (score >= 65) {
    grade = '📊 C급 (보통)';
    comment = '일부 개선이 필요하지만 사용 가능한 수준입니다';
  } else {
    grade = '⚠️ D급 (개선필요)';
    comment = '성능 개선이 시급히 필요합니다';
  }

  return { grade, score, comment };
}

// Node.js 환경에서만 실행
if (typeof window === 'undefined') {
  runPerformanceTest()
    .then(result => {
      console.log('\n🎉 성능 테스트 완료!');

      if (result.successRate >= 95 && result.avgResponseTime <= 500) {
        console.log('🚀 시스템이 프로덕션 환경에서 우수한 성능을 보여줍니다!');
        process.exit(0);
      } else if (result.successRate >= 80) {
        console.log('✅ 시스템이 프로덕션 환경에서 양호한 성능을 보여줍니다.');
        process.exit(0);
      } else {
        console.log('⚠️ 시스템 성능 개선이 필요합니다.');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 성능 테스트 실행 중 오류:', error.message);
      process.exit(1);
    });
}

module.exports = { runPerformanceTest };
